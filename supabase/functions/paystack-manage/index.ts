// Subscription management for the signed-in user: read status or cancel the
// active Paystack subscription (access continues until the paid period ends).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, json, paystackFetch, secretKey } from "../_shared/paystack.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  let body: any = {};
  try {
    body = await req.json();
  } catch { /* default to status */ }

  const action = String(body?.action ?? "status");
  if (!["status", "cancel"].includes(action)) return json({ error: "Unknown action" }, 400);

  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: profile } = await admin
    .from("profiles")
    .select(
      "email, plan_type, plus_status, plus_expires_at, paystack_plan_code, paystack_subscription_code, paystack_email_token, paystack_customer_code, is_tester",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return json({ error: "Profile not found" }, 404);

  /**
   * The subscription code only lands on the profile via the subscription.create
   * webhook. When that never arrived, resolve it live from Paystack using the
   * mum's email so she can always stop the recurring debit.
   */
  const resolveSubscription = async (): Promise<{ code: string; token: string } | null> => {
    if (profile.paystack_subscription_code && profile.paystack_email_token) {
      return { code: profile.paystack_subscription_code, token: profile.paystack_email_token };
    }
    if (!secretKey()) return null;

    let customerCode = profile.paystack_customer_code as string | null;
    const email = (profile.email || user.email || "").trim();
    if (!customerCode && email) {
      const cust = await paystackFetch(`/customer/${encodeURIComponent(email)}`);
      customerCode = cust.ok ? cust.body?.data?.customer_code ?? null : null;
    }
    if (!customerCode) return null;

    const subs = await paystackFetch(`/subscription?customer=${encodeURIComponent(customerCode)}`);
    const active = (subs.ok ? subs.body?.data ?? [] : []).find((s: any) =>
      ["active", "attention"].includes(String(s?.status ?? "").toLowerCase()),
    );
    if (!active?.subscription_code || !active?.email_token) return null;

    await admin
      .from("profiles")
      .update({
        paystack_customer_code: customerCode,
        paystack_subscription_code: active.subscription_code,
        paystack_email_token: active.email_token,
      })
      .eq("id", user.id);

    profile.paystack_subscription_code = active.subscription_code;
    profile.paystack_email_token = active.email_token;
    return { code: active.subscription_code, token: active.email_token };
  };

  const status = (hasSub?: boolean) => ({
    plan_type: profile.plan_type,
    status: profile.plus_status ?? null,
    expires_at: profile.plus_expires_at ?? null,
    plan_code: profile.paystack_plan_code ?? null,
    has_subscription: hasSub ?? Boolean(profile.paystack_subscription_code),
    tester: Boolean(profile.is_tester),
  });

  if (action === "status") {
    // Resolve lazily so the manage UI knows a recurring debit exists even when
    // the webhook never stored the code.
    if (!profile.is_tester && profile.plan_type === "premium" && !profile.paystack_subscription_code) {
      await resolveSubscription();
    }
    return json(status());
  }

  // cancel
  if (profile.is_tester) return json({ ...status(), cancelled: false, message: "Tester account." });

  if (!secretKey()) return json({ error: "Payments are not configured yet." }, 503);

  const sub = await resolveSubscription();
  if (!sub) {
    return json({
      ...status(false),
      cancelled: false,
      message:
        "We couldn't find a recurring subscription on your account — nothing will be debited again. Your Plus access stays until it expires.",
    });
  }


  const res = await paystackFetch("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({ code: sub.code, token: sub.token }),
  });


  if (!res.ok) {
    console.error("[paystack-manage] disable failed", res.status, JSON.stringify(res.body));
    return json({ error: res.body?.message || "Could not cancel the subscription." }, 502);
  }

  await admin
    .from("profiles")
    .update({ plus_status: "cancelled", plus_last_event: "cancel" })
    .eq("id", user.id);

  return json({
    ...status(),
    status: "cancelled",
    cancelled: true,
    message: "Your subscription will not renew. You keep Plus until the current period ends.",
  });
});

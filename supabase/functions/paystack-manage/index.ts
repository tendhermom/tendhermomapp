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
      "plan_type, plus_status, plus_expires_at, paystack_plan_code, paystack_subscription_code, paystack_email_token, is_tester",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return json({ error: "Profile not found" }, 404);

  const status = () => ({
    plan_type: profile.plan_type,
    status: profile.plus_status ?? null,
    expires_at: profile.plus_expires_at ?? null,
    plan_code: profile.paystack_plan_code ?? null,
    has_subscription: Boolean(profile.paystack_subscription_code),
    tester: Boolean(profile.is_tester),
  });

  if (action === "status") return json(status());

  // cancel
  if (profile.is_tester) return json({ ...status(), cancelled: false, message: "Tester account." });

  if (!profile.paystack_subscription_code || !profile.paystack_email_token) {
    return json({ error: "No active subscription to cancel." }, 400);
  }
  if (!secretKey()) return json({ error: "Payments are not configured yet." }, 503);

  const res = await paystackFetch("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({
      code: profile.paystack_subscription_code,
      token: profile.paystack_email_token,
    }),
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

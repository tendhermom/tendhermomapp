// Verifies a Paystack transaction reference for the signed-in user and unlocks
// TendherMom Plus immediately (the webhook is the long-term source of truth).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  corsHeaders,
  json,
  PLANS,
  planByCode,
  paystackFetch,
  secretKey,
  expiryFor,
  type PlanId,
} from "../_shared/paystack.ts";

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

  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Permanent testers are always premium.
  const { data: profile } = await admin
    .from("profiles")
    .select("is_tester, plan_type, plus_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_tester) {
    await admin
      .from("profiles")
      .update({ plan_type: "premium", plus_status: "tester", plus_expires_at: null })
      .eq("id", user.id);
    return json({ plan_type: "premium", expires_at: null, tester: true });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch { /* verify without a reference = deep re-check */ }

  let reference = typeof body?.reference === "string" ? body.reference.trim() : "";

  // ── No reference: deep re-check ("I already paid") ───────────
  // Never answer from the profile alone — that is exactly how a paid mum ends
  // up being told she has no subscription. Ask Paystack directly.
  if (!reference) {
    const activeNow =
      profile?.plan_type === "premium" &&
      (!profile?.plus_expires_at || new Date(profile.plus_expires_at).getTime() > Date.now());
    if (activeNow) {
      return json({ plan_type: "premium", expires_at: profile?.plus_expires_at ?? null });
    }

    if (!secretKey()) return json({ error: "Payments are not configured yet." }, 503);

    // 1. Re-verify the mum's recent checkout references.
    const { data: recent } = await admin
      .from("payment_transactions")
      .select("reference")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    for (const row of recent ?? []) {
      const res = await paystackFetch(`/transaction/verify/${encodeURIComponent(row.reference)}`);
      if (res.ok && String(res.body?.data?.status ?? "").toLowerCase() === "success") {
        reference = row.reference;
        break;
      }
    }

    // 2. Still nothing — look the customer up by email and honour any
    //    active subscription or successful charge on the account.
    if (!reference) {
      const { data: p2 } = await admin
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .maybeSingle();
      const email = (p2?.email || user.email || "").trim();

      if (email) {
        const cust = await paystackFetch(`/customer/${encodeURIComponent(email)}`);
        const customerCode = cust.ok ? cust.body?.data?.customer_code ?? null : null;

        if (customerCode) {
          const subs = await paystackFetch(`/subscription?customer=${encodeURIComponent(customerCode)}`);
          const active = (subs.ok ? subs.body?.data ?? [] : []).find((s: any) =>
            ["active", "non-renewing", "attention"].includes(String(s?.status ?? "").toLowerCase()),
          );

          if (active) {
            const plan = planByCode(active?.plan?.plan_code) ?? PLANS.monthly;
            const next = active?.next_payment_date ? new Date(active.next_payment_date) : null;
            const expiresAt =
              next && !Number.isNaN(next.getTime())
                ? new Date(next.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
                : expiryFor(plan);

            await admin
              .from("profiles")
              .update({
                plan_type: "premium",
                plus_provider: "paystack",
                plus_status: String(active?.status ?? "").toLowerCase() === "active" ? "active" : "cancelled",
                plus_expires_at: expiresAt,
                plus_product_id: plan.code,
                plus_last_event: "verify_customer_lookup",
                paystack_plan_code: plan.code,
                paystack_customer_code: customerCode,
                paystack_subscription_code: active?.subscription_code ?? null,
                paystack_email_token: active?.email_token ?? null,
              })
              .eq("id", user.id);

            return json({ plan_type: "premium", expires_at: expiresAt });
          }

          // No subscription object — fall back to a recent successful charge.
          const txns = await paystackFetch(
            `/transaction?customer=${encodeURIComponent(customerCode)}&status=success&perPage=5`,
          );
          const paid = (txns.ok ? txns.body?.data ?? [] : [])[0];
          if (paid?.reference) reference = String(paid.reference);
        }
      }
    }

    if (!reference) {
      return json({ plan_type: "free", expires_at: null });
    }
  }


  if (!secretKey()) return json({ error: "Payments are not configured yet." }, 503);

  // The reference must belong to this user.
  const { data: txn } = await admin
    .from("payment_transactions")
    .select("id, user_id, plan_id")
    .eq("reference", reference)
    .maybeSingle();

  if (txn && txn.user_id !== user.id) return json({ error: "Unauthorized" }, 403);

  const res = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
  if (!res.ok) {
    console.error("[paystack-verify] failed", res.status, JSON.stringify(res.body));
    return json({ error: "Could not confirm the payment yet." }, 502);
  }

  const data = res.body?.data ?? {};
  const metaUserId = data?.metadata?.user_id;
  if (metaUserId && metaUserId !== user.id) return json({ error: "Unauthorized" }, 403);

  const success = String(data?.status ?? "").toLowerCase() === "success";
  const planId: PlanId =
    (txn?.plan_id as PlanId) ||
    (data?.metadata?.plan_id as PlanId) ||
    (planByCode(data?.plan_object?.plan_code)?.id ?? "monthly");
  const plan = PLANS[planId] ?? PLANS.monthly;

  await admin
    .from("payment_transactions")
    .update({
      status: success ? "success" : String(data?.status ?? "failed"),
      paid_at: success ? new Date(data?.paid_at ?? Date.now()).toISOString() : null,
    })
    .eq("reference", reference);

  if (!success) {
    return json({ plan_type: "free", expires_at: null, status: data?.status ?? "pending" });
  }

  const expiresAt = expiryFor(plan, new Date(data?.paid_at ?? Date.now()));

  const { error } = await admin
    .from("profiles")
    .update({
      plan_type: "premium",
      plus_provider: "paystack",
      plus_expires_at: expiresAt,
      plus_product_id: plan.code,
      plus_status: "active",
      plus_last_event: "verify",
      paystack_plan_code: plan.code,
      paystack_customer_code: data?.customer?.customer_code ?? null,
    })
    .eq("id", user.id);

  if (error) return json({ error: error.message }, 500);

  return json({ plan_type: "premium", expires_at: expiresAt });
});

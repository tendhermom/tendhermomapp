// Paystack webhook — keeps profiles in sync with subscription lifecycle events.
// Configure in the Paystack dashboard (Settings → API Keys & Webhooks) with the
// live webhook URL for this function. Signature: HMAC-SHA512 of the raw body
// using the live secret key, sent as `x-paystack-signature`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { createHmac } from "node:crypto";
import { corsHeaders, json, PLANS, planByCode, secretKey, expiryFor } from "../_shared/paystack.ts";

const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const key = secretKey();
  if (!key) return json({ error: "Not configured" }, 503);

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", key).update(raw).digest("hex");
  if (!signature || signature !== expected) {
    console.warn("[paystack-webhook] bad signature");
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const event = String(payload?.event ?? "");
  const data = payload?.data ?? {};
  const db = admin();

  // ── Resolve the profile ──────────────────────────────────────
  let userId: string | null = data?.metadata?.user_id ?? null;

  if (!userId && data?.subscription_code) {
    const { data: p } = await db
      .from("profiles")
      .select("id")
      .eq("paystack_subscription_code", data.subscription_code)
      .maybeSingle();
    userId = p?.id ?? null;
  }

  if (!userId) {
    const email = data?.customer?.email ?? data?.customer?.customer_email ?? null;
    if (email) {
      const { data: p } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
      userId = p?.id ?? null;
    }
  }

  if (!userId) {
    console.warn("[paystack-webhook] no matching user for", event);
    return json({ received: true, skipped: "unknown user" });
  }

  const { data: profile } = await db
    .from("profiles")
    .select("id, is_tester, plus_expires_at")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return json({ received: true, skipped: "unknown user" });

  const planCode: string | null =
    data?.plan?.plan_code ?? data?.plan_object?.plan_code ?? data?.subscription?.plan?.plan_code ?? null;
  const plan = planByCode(planCode) ?? PLANS.monthly;

  const nextPayment = data?.next_payment_date ? new Date(data.next_payment_date) : null;
  const update: Record<string, unknown> = {
    plus_provider: "paystack",
    plus_last_event: event,
  };

  const grantUntil = (from?: Date | null) =>
    nextPayment
      ? new Date(nextPayment.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
      : expiryFor(plan, from ?? new Date());

  switch (event) {
    case "charge.success":
    case "invoice.payment_successful":
    case "invoice.create": {
      if (event === "invoice.create" && !data?.paid) break;
      update.plan_type = "premium";
      update.plus_status = "active";
      update.plus_expires_at = grantUntil(data?.paid_at ? new Date(data.paid_at) : new Date());
      update.plus_product_id = plan.code;
      update.paystack_plan_code = plan.code;
      if (data?.customer?.customer_code) update.paystack_customer_code = data.customer.customer_code;
      break;
    }
    case "subscription.create": {
      update.plan_type = "premium";
      update.plus_status = "active";
      update.plus_expires_at = grantUntil();
      update.plus_product_id = plan.code;
      update.paystack_plan_code = plan.code;
      update.paystack_subscription_code = data?.subscription_code ?? null;
      update.paystack_email_token = data?.email_token ?? null;
      if (data?.customer?.customer_code) update.paystack_customer_code = data.customer.customer_code;
      break;
    }
    case "subscription.not_renew":
    case "subscription.disable": {
      // Keep access until the period already paid for runs out.
      const until = profile.plus_expires_at ? new Date(profile.plus_expires_at) : nextPayment;
      const stillActive = until ? until.getTime() > Date.now() : false;
      update.plan_type = stillActive ? "premium" : "free";
      update.plus_status = stillActive ? "cancelled" : "expired";
      if (until) update.plus_expires_at = until.toISOString();
      break;
    }
    case "invoice.payment_failed": {
      const until = profile.plus_expires_at ? new Date(profile.plus_expires_at) : null;
      const stillActive = until ? until.getTime() > Date.now() : false;
      update.plan_type = stillActive ? "premium" : "free";
      update.plus_status = "billing_issue";
      break;
    }
    case "subscription.expiring_cards":
    case "customeridentification.success":
      return json({ received: true, skipped: event });
    default:
      return json({ received: true, skipped: event });
  }

  // Testers never lose access.
  if (profile.is_tester) {
    update.plan_type = "premium";
    update.plus_status = "tester";
    update.plus_expires_at = null;
  }

  if (data?.reference) {
    await db
      .from("payment_transactions")
      .update({ status: "success", paid_at: new Date(data?.paid_at ?? Date.now()).toISOString() })
      .eq("reference", data.reference)
      .eq("user_id", userId);
  }

  const { error } = await db.from("profiles").update(update).eq("id", userId);
  if (error) {
    console.error("[paystack-webhook] update failed", error.message);
    return json({ error: error.message }, 500);
  }

  return json({ received: true, event });
});

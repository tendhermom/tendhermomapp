// RevenueCat webhook — receives subscription lifecycle events and keeps
// profiles.plan_type in sync with the "Pro" entitlement.
// Configure in RevenueCat: Integrations → Webhooks, with an Authorization
// header equal to REVENUECAT_WEBHOOK_SECRET, and "All events" selected.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** The entitlement that unlocks TendherMom Plus (matches the RevenueCat dashboard). */
const PRO_ENTITLEMENT = "pro";

// Events that grant / keep access
const ACTIVE_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "SUBSCRIPTION_EXTENDED",
  "PRODUCT_CHANGE",
  "NON_RENEWING_PURCHASE",
  "TRANSFER",
]);

// Cancelled: still active until the paid period ends
const CANCELLED_TYPES = new Set(["CANCELLATION"]);

// Events that revoke access immediately
const REVOKE_TYPES = new Set(["EXPIRATION", "REFUND", "SUBSCRIPTION_PAUSED"]);

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expected = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  if (!expected) return json({ error: "Webhook secret not configured" }, 503);

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (token !== expected && auth !== expected) return json({ error: "Unauthorized" }, 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const event = body?.event ?? {};
  const type = String(event.type ?? "");
  const entitlements: string[] = event.entitlement_ids ?? (event.entitlement_id ? [event.entitlement_id] : []);
  const userId: string | undefined = event.app_user_id ?? event.original_app_user_id;

  if (!userId) return json({ received: true, skipped: "no app_user_id" });

  // Only honour the Pro entitlement (case-insensitive to match dashboard naming).
  if (entitlements.length && !entitlements.some((e) => String(e).toLowerCase() === PRO_ENTITLEMENT)) {
    return json({ received: true, skipped: "other entitlement" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Resolve the profile; skip sandbox traffic for non-testers.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_tester")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    console.warn("[revenuecat-webhook] unknown app_user_id", userId);
    return json({ received: true, skipped: "unknown user" });
  }

  const environment = String(event.environment ?? "").toUpperCase();
  if (environment === "SANDBOX" && !profile.is_tester) {
    return json({ received: true, skipped: "sandbox event for non-tester" });
  }

  const expiresMs = Number(event.expiration_at_ms ?? 0);
  const graceMs = Number(event.grace_period_expires_at_ms ?? 0);
  const accessUntilMs = Math.max(expiresMs, graceMs);
  const notExpired = accessUntilMs ? accessUntilMs > Date.now() : true;

  let isActive: boolean;
  let status: string;

  if (REVOKE_TYPES.has(type)) {
    isActive = false;
    status = type === "REFUND" ? "refunded" : type === "SUBSCRIPTION_PAUSED" ? "paused" : "expired";
  } else if (CANCELLED_TYPES.has(type)) {
    isActive = notExpired;
    status = "cancelled";
  } else if (type === "BILLING_ISSUE") {
    isActive = notExpired; // stays on through any grace period
    status = "billing_issue";
  } else if (ACTIVE_TYPES.has(type)) {
    isActive = notExpired;
    status = "active";
  } else {
    isActive = notExpired;
    status = "active";
  }

  // Testers always keep access regardless of store state.
  const grantPremium = isActive || profile.is_tester === true;

  const { error } = await supabase
    .from("profiles")
    .update({
      plan_type: grantPremium ? "premium" : "free",
      plus_provider: "revenuecat",
      plus_expires_at: accessUntilMs && !profile.is_tester ? new Date(accessUntilMs).toISOString() : null,
      plus_product_id: event.product_id ?? null,
      plus_original_tx_id: event.original_transaction_id ?? null,
      plus_store: event.store ?? null,
      plus_status: profile.is_tester ? "tester" : status,
      plus_last_event: type,
    })
    .eq("id", userId);

  if (error) {
    console.error("[revenuecat-webhook] update failed", error.message);
    return json({ error: error.message }, 500);
  }

  return json({ received: true, type, active: grantPremium, status });
});

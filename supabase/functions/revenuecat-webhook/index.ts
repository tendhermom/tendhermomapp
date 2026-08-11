// RevenueCat webhook — receives subscription lifecycle events and keeps
// profiles.plan_type in sync. Configure this URL in RevenueCat:
//   Project settings → Integrations → Webhooks
// with an Authorization header equal to REVENUECAT_WEBHOOK_SECRET.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLUS_ENTITLEMENT = "plus";

const ACTIVE_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
  "SUBSCRIPTION_EXTENDED",
  "TRANSFER",
]);

const INACTIVE_TYPES = new Set(["EXPIRATION", "REFUND", "SUBSCRIPTION_PAUSED", "BILLING_ISSUE"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expected = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  if (!expected) {
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== expected && auth !== `Bearer ${expected}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const event = body?.event ?? {};
  const type = String(event.type ?? "");
  const entitlements: string[] = event.entitlement_ids ?? (event.entitlement_id ? [event.entitlement_id] : []);
  const userId: string | undefined = event.app_user_id ?? event.original_app_user_id;

  if (!userId) {
    return new Response(JSON.stringify({ received: true, skipped: "no app_user_id" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (entitlements.length && !entitlements.includes(PLUS_ENTITLEMENT)) {
    return new Response(JSON.stringify({ received: true, skipped: "other entitlement" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expiresMs = Number(event.expiration_at_ms ?? 0);
  const notExpired = expiresMs ? expiresMs > Date.now() : true;
  const isActive = ACTIVE_TYPES.has(type) ? notExpired : INACTIVE_TYPES.has(type) ? false : notExpired;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { error } = await supabase
    .from("profiles")
    .update({
      plan_type: isActive ? "premium" : "free",
      plus_provider: "revenuecat",
      plus_expires_at: expiresMs ? new Date(expiresMs).toISOString() : null,
    })
    .eq("id", userId);

  if (error) {
    console.error("[revenuecat-webhook] update failed", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true, type, active: isActive }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

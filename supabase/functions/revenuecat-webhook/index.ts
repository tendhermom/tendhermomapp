// RevenueCat webhook receiver. Keeps profile Plus status in sync with App Store
// subscription lifecycle events (renewals, cancellations, refunds).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, json } from "../_shared/paystack.ts";

const ENTITLEMENT_ID = "entl269e323869"; // keep in sync with src/lib/revenuecat.ts

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Events that (re)grant or extend the entitlement.
const GRANTING = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "SUBSCRIPTION_EXTENDED",
  "PRODUCT_CHANGE",
  "TRANSFER",
]);
// Events that revoke it outright.
const REVOKING = new Set(["EXPIRATION", "REFUND"]);
// CANCELLATION / BILLING_ISSUE keep access until the paid period ends.

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Shared-secret check: the same value must be set as the webhook's
  // Authorization header in the RevenueCat dashboard.
  const secret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  const provided = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!secret || provided !== secret) return json({ error: "Unauthorized" }, 401);

  let payload: any = null;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid payload" }, 400);
  }

  const event = payload?.event;
  if (!event) return json({ ok: true, skipped: "no event" });

  const type = String(event.type ?? "").toUpperCase();
  const entId = event.entitlement_id ?? null;
  // If the event names an entitlement, it must be ours; events without one
  // are ignored (conservative — never unlock on an ambiguous event).
  if (!entId || String(entId).toLowerCase() !== ENTITLEMENT_ID.toLowerCase()) {
    return json({ ok: true, skipped: "other entitlement" });
  }

  const appUserId = String(event.app_user_id ?? "");
  if (!UUID_RE.test(appUserId)) return json({ ok: true, skipped: "anonymous user" });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("is_tester")
    .eq("id", appUserId)
    .maybeSingle();
  if (!profile) return json({ ok: true, skipped: "unknown user" });

  // Sandbox events may only move tester accounts.
  if (String(event.environment ?? "PRODUCTION").toUpperCase() === "SANDBOX" && !profile.is_tester) {
    return json({ ok: true, skipped: "sandbox" });
  }

  const expirationAtMs = Number(event.expiration_atms ?? NaN);
  const expiresAt = Number.isFinite(expirationAtMs) ? new Date(expirationAtMs).toISOString() : null;

  if (GRANTING.has(type)) {
    await admin
      .from("profiles")
      .update({
        plan_type: "premium",
        plus_provider: "revenuecat",
        plus_status: "active",
        plus_expires_at: expiresAt,
        plus_product_id: event.product_id ?? null,
        plus_last_event: type.toLowerCase(),
      })
      .eq("id", appUserId);
    return json({ ok: true, action: "granted" });
  }

  if (type === "CANCELLATION" || type === "BILLING_ISSUE") {
    await admin
      .from("profiles")
      .update({
        plus_status: "cancelled",
        plus_product_id: event.product_id ?? null,
        plus_last_event: type.toLowerCase(),
      })
      .eq("id", appUserId);
    return json({ ok: true, action: "marked-cancelling" });
  }

  if (REVOKING.has(type)) {
    await admin
      .from("profiles")
      .update({
        plan_type: "free",
        plus_status: type === "REFUND" ? "refunded" : "expired",
        plus_expires_at: null,
        plus_product_id: event.product_id ?? null,
        plus_last_event: type.toLowerCase(),
      })
      .eq("id", appUserId);
    return json({ ok: true, action: "revoked" });
  }

  return json({ ok: true, skipped: "unhandled event" });
});

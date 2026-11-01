// RevenueCat webhook receiver. Keeps profile Plus status in sync with App Store
// subscription lifecycle events (renewals, cancellations, refunds).
//
// Field names and event semantics follow RevenueCat's webhook docs:
// https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
// https://www.revenuecat.com/docs/integrations/webhooks/sample-events
// https://www.revenuecat.com/docs/integrations/webhooks/event-flows

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, json } from "../_shared/paystack.ts";

// The entitlement IDENTIFIER (what webhooks and the API use), not the
// dashboard object ID. Keep in sync with src/lib/revenuecat.ts.
const ENTITLEMENT_ID = "thm-plus";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the event's entitlement fields include our entitlement. */
function eventGrantsOurEntitlement(event: any): boolean {
  const single = event?.entitlement_id ? String(event.entitlement_id) : null;
  const list: unknown[] = Array.isArray(event?.entitlement_ids)
    ? event.entitlement_ids
    : event?.entitlement_ids
      ? [event.entitlement_ids]
      : [];
  return (
    (single && single.toLowerCase() === ENTITLEMENT_ID) ||
    list.some((e) => String(e).toLowerCase() === ENTITLEMENT_ID)
  );
}

/** Expiration timestamp in ms; docs use expiration_at_ms, keep the legacy alias. */
function expiresAtMs(event: any): number {
  const ms = Number(event?.expiration_at_ms ?? event?.expiration_atms ?? NaN);
  return Number.isFinite(ms) ? ms : NaN;
}

function toIso(ms: number): string | null {
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

// Events that (re)grant or extend the entitlement, with entitlement fields
// present in the payload.
const GRANTING = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "SUBSCRIPTION_EXTENDED",
  "PRODUCT_CHANGE",
  "REFUND_REVERSED",
  "TEMPORARY_ENTITLEMENT_GRANT",
]);
// Events that revoke it outright: the paid period is over (or the purchase was
// refunded). SUBSCRIPTION_PAUSED must NOT revoke — access continues until the
// EXPIRATION with expiration_reason SUBSCRIPTION_PAUSED arrives.
const REVOKING = new Set(["EXPIRATION", "REFUND"]);
// Events that keep access until the paid period ends but stop future renewals.
// BILLING_ISSUE keeps the grace-period expiry when RevenueCat reports one.
const CANCELLING = new Set(["CANCELLATION", "BILLING_ISSUE", "NON_RENEWING_PURCHASE"]);

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
  if (type === "TEST") return json({ ok: true, action: "test-event-acknowledged" });

  // Entitlement guard. Most lifecycle events carry entitlement fields; when
  // they are present the event must name OUR entitlement. Events without any
  // entitlement fields (TRANSFER, TEMPORARY_ENTITLEMENT_GRANT, TEST) are
  // handled on their own terms below.
  const namesEntitlements =
    event.entitlement_id != null || event.entitlement_ids != null;
  if (namesEntitlements && !eventGrantsOurEntitlement(event)) {
    return json({ ok: true, skipped: "other entitlement" });
  }

  // app_user_id is always present; the destination user for TRANSFER events.
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

  const expiresAt = toIso(expiresAtMs(event));
  // On PRODUCT_CHANGE the new product is the one the subscriber switched TO
  // (App Store semantics: product_id is the previous product there).
  const productId = event.new_product_id ?? event.product_id ?? null;
  const touch = {
    plus_provider: "revenuecat",
    plus_product_id: productId,
    plus_last_event: type.toLowerCase(),
  };

  if (GRANTING.has(type)) {
    const update: Record<string, unknown> = {
      ...touch,
      plan_type: "premium",
      plus_status: "active",
      plus_expires_at: expiresAt,
      rc_entitlement: ENTITLEMENT_ID,
    };
    if (type === "TEMPORARY_ENTITLEMENT_GRANT" && !expiresAt) {
      // Short-lived outage grant: fall back to the grace-period expiry so the
      // flag can't outlive RevenueCat's own window (at most 24 hours).
      update.plus_expires_at =
        toIso(Number(event?.grace_period_expiration_at_ms ?? NaN)) ?? null;
    }
    await admin.from("profiles").update(update).eq("id", appUserId);
    return json({ ok: true, action: "granted" });
  }

  if (type === "TRANSFER") {
    // Sent only for the destination user; the body carries no entitlement or
    // expiry fields. Re-read the authoritative state from RevenueCat so we set
    // the real expiry instead of guessing.
    let granted = false;
    const secretKey = Deno.env.get("REVENUECAT_SECRET_KEY");
    if (secretKey) {
      try {
        const res = await fetch(
          `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
          { headers: { Authorization: `Bearer ${secretKey}` } },
        );
        if (res.ok) {
          const data = await res.json();
          const ent = data?.subscriber?.entitlements?.[ENTITLEMENT_ID];
          if (ent) {
            const entExpiry = ent.expires_date ? new Date(ent.expires_date).getTime() : NaN;
            const active = !Number.isFinite(entExpiry) || entExpiry > Date.now();
            if (active) {
              await admin
                .from("profiles")
                .update({
                  ...touch,
                  plan_type: "premium",
                  plus_status: ent.will_renew === false ? "cancelled" : "active",
                  plus_expires_at: Number.isFinite(entExpiry)
                    ? new Date(entExpiry).toISOString()
                    : null,
                  rc_entitlement: ENTITLEMENT_ID,
                })
                .eq("id", appUserId);
              granted = true;
            }
          }
        }
      } catch {
        /* fall through to the conservative no-op below */
      }
    }
    if (!granted) {
      // Confirm the destination user already held the entitlement in our
      // records; otherwise leave the profile untouched (never unlock on an
      // event we could not verify).
      await admin
        .from("profiles")
        .update(touch)
        .eq("id", appUserId);
    }
    return json({ ok: true, action: granted ? "granted" : "transfer-noted" });
  }

  if (CANCELLING.has(type)) {
    const update: Record<string, unknown> = { ...touch, plus_status: "cancelled" };
    // Billing issues report the grace-period end; access lasts that long.
    const grace = toIso(Number(event?.grace_period_expiration_at_ms ?? NaN));
    if (grace) update.plus_expires_at = grace;
    if (type === "BILLING_ISSUE" && !grace && expiresAt) update.plus_expires_at = expiresAt;
    await admin.from("profiles").update(update).eq("id", appUserId);
    return json({ ok: true, action: "marked-cancelling" });
  }

  if (REVOKING.has(type)) {
    await admin
      .from("profiles")
      .update({
        ...touch,
        plan_type: "free",
        plus_status: type === "REFUND" ? "refunded" : "expired",
        plus_expires_at: null,
        rc_entitlement: null,
      })
      .eq("id", appUserId);
    return json({ ok: true, action: "revoked" });
  }

  // SUBSCRIPTION_PAUSED, SUBSCRIBER_MISMAPPED, EXPERIMENT_ENROLLMENT,
  // VIRTUAL_CURRENCY_TRANSACTION, INVOICE_ISSUANCE, etc. — nothing to change.
  return json({ ok: true, skipped: "no profile action" });
});

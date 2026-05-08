// Google Play Billing — Real-time Developer Notifications + client purchase verification.
// Handles two entry shapes:
//   1) POST { message: { data: base64 } }  — Pub/Sub push from Play Billing RTDN
//   2) POST { mode: "verify", purchaseToken, productId, userId }  — from the app after a purchase
//
// Server verification calls Android Publisher API:
//   GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{pkg}/purchases/subscriptions/{sku}/tokens/{token}
//
// Until GOOGLE_PLAY_SERVICE_ACCOUNT_JSON + GOOGLE_PLAY_PACKAGE_NAME are set, the function
// runs in permissive mode (records the purchase as active without remote verification).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLUS_PRODUCT_IDS = new Set([
  "tendhermom_plus_weekly",
  "tendhermom_plus_monthly",
  "tendhermom_plus_yearly",
]);

// Maps Play notification type → active/inactive
// https://developer.android.com/google/play/billing/rtdn-reference#sub
const ACTIVE_TYPES = new Set([1, 2, 4, 7]); // RECOVERED, RENEWED, PURCHASED, RESTARTED
const INACTIVE_TYPES = new Set([3, 10, 12, 13]); // CANCELED, PAUSED, REVOKED, EXPIRED

interface SubscriptionInfo {
  expiryTimeMillis: string;
  startTimeMillis?: string;
  autoRenewing?: boolean;
}

async function getGoogleAccessToken(): Promise<string | null> {
  const json = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
  if (!json) return null;
  try {
    const sa = JSON.parse(json);
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const claims = {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };
    const enc = (obj: any) =>
      btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const unsigned = `${enc(header)}.${enc(claims)}`;

    // Import RSA private key from PEM
    const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
    const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "pkcs8",
      der,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(unsigned),
    );
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const jwt = `${unsigned}.${sigB64}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await tokenRes.json();
    return data.access_token ?? null;
  } catch (e) {
    console.error("[google-iap-webhook] getAccessToken failed", e);
    return null;
  }
}

async function fetchSubscriptionInfo(
  productId: string,
  purchaseToken: string,
): Promise<SubscriptionInfo | null> {
  const pkg = Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME");
  if (!pkg) return null;
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) return null;
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    console.error("[google-iap-webhook] subscriptions.get failed", res.status, await res.text());
    return null;
  }
  return (await res.json()) as SubscriptionInfo;
}

async function applyPurchase(
  supabase: any,
  userId: string,
  productId: string,
  purchaseToken: string,
  expiryMs: number,
  isActive: boolean,
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      plan_type: isActive ? "premium" : "free",
      plus_provider: "google",
      plus_product_id: productId,
      plus_original_tx_id: purchaseToken,
      plus_expires_at: new Date(expiryMs).toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const PERMISSIVE = !Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
    if (PERMISSIVE) {
      console.warn(
        "[google-iap-webhook] GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not set — running in PERMISSIVE mode. Add the secret before going live.",
      );
    }

    const body = await req.json();

    // ── Path 1: client-side purchase verification ──────────────────────
    if (body.mode === "verify") {
      const { purchaseToken, productId, userId } = body;
      if (!purchaseToken || !productId || !userId) {
        return new Response(
          JSON.stringify({ error: "purchaseToken, productId, userId required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (!PLUS_PRODUCT_IDS.has(productId)) {
        return new Response(JSON.stringify({ error: "Unknown product" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      let expiryMs = Date.now() + 30 * 24 * 60 * 60 * 1000; // permissive fallback: 30 days
      let isActive = true;
      if (!PERMISSIVE) {
        const info = await fetchSubscriptionInfo(productId, purchaseToken);
        if (!info) {
          return new Response(JSON.stringify({ error: "Verification failed" }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        expiryMs = parseInt(info.expiryTimeMillis, 10);
        isActive = expiryMs > Date.now();
      }
      await applyPurchase(supabase, userId, productId, purchaseToken, expiryMs, isActive);
      return new Response(
        JSON.stringify({
          success: true,
          plan_type: isActive ? "premium" : "free",
          expires_at: new Date(expiryMs).toISOString(),
          permissive: PERMISSIVE,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Path 2: Pub/Sub push from Play RTDN ────────────────────────────
    if (!body.message?.data) {
      return new Response(JSON.stringify({ error: "Invalid Pub/Sub message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const decoded = JSON.parse(atob(body.message.data));
    const sub = decoded.subscriptionNotification;
    if (!sub) {
      return new Response(JSON.stringify({ received: true, ignored: "non_subscription" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { notificationType, purchaseToken, subscriptionId } = sub;

    if (!PLUS_PRODUCT_IDS.has(subscriptionId)) {
      return new Response(JSON.stringify({ received: true, ignored: "unknown_product" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the user by stored purchaseToken (set during initial purchase verification)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("plus_original_tx_id", purchaseToken)
      .maybeSingle();

    if (!profile?.id) {
      console.warn("[google-iap-webhook] No user for purchaseToken", purchaseToken);
      return new Response(JSON.stringify({ received: true, ignored: "no_user" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let expiryMs = Date.now();
    if (!PERMISSIVE) {
      const info = await fetchSubscriptionInfo(subscriptionId, purchaseToken);
      if (info) expiryMs = parseInt(info.expiryTimeMillis, 10);
    } else {
      expiryMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
    }

    let isActive = expiryMs > Date.now();
    if (ACTIVE_TYPES.has(notificationType)) isActive = true;
    if (INACTIVE_TYPES.has(notificationType)) isActive = false;

    await applyPurchase(
      supabase,
      profile.id,
      subscriptionId,
      purchaseToken,
      expiryMs,
      isActive,
    );

    console.log(
      `[google-iap-webhook] type=${notificationType} → user ${profile.id} active=${isActive}`,
    );

    return new Response(JSON.stringify({ received: true, applied: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[google-iap-webhook] error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

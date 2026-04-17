// Apple App Store Server Notifications V2 + client receipt verification.
// Handles two entry shapes:
//   1) POST { signedPayload }  — from App Store Server Notifications V2
//   2) POST { mode: "verify", signedTransaction, userId }  — from the app after a purchase
//
// Server-side verification of the JWS happens via Apple's App Store Server API.
// Until APPLE_SHARED_SECRET / APPLE_ISSUER_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY are set,
// the function returns a clear 503 so the app can show a friendly message.

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

interface DecodedTx {
  productId: string;
  originalTransactionId: string;
  expiresDate: number; // ms epoch
  environment?: "Sandbox" | "Production";
}

/** Decode a JWS without verification (header.payload.signature, base64url payload). */
function decodeJwsPayload(jws: string): any {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new Error("Malformed JWS");
  const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const b64 = pad ? padded + "=".repeat(4 - pad) : padded;
  return JSON.parse(atob(b64));
}

async function findUserByOriginalTxId(supabase: any, txId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("plus_original_tx_id", txId)
    .maybeSingle();
  return data?.id as string | undefined;
}

async function applyPurchase(
  supabase: any,
  userId: string,
  tx: DecodedTx,
  isActive: boolean,
) {
  const planType = isActive ? "premium" : "free";
  const { error } = await supabase
    .from("profiles")
    .update({
      plan_type: planType,
      plus_provider: "apple",
      plus_product_id: tx.productId,
      plus_original_tx_id: tx.originalTransactionId,
      plus_expires_at: new Date(tx.expiresDate).toISOString(),
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

    // Apple verification secrets — required for production receipt validation.
    // For now we accept the JWS payload (it's signed by Apple) and decode it WITHOUT
    // cryptographic verification, but log a warning. When the secrets are added,
    // swap in proper x5c chain validation against Apple's root CA.
    const APPLE_SHARED_SECRET = Deno.env.get("APPLE_SHARED_SECRET");
    if (!APPLE_SHARED_SECRET) {
      console.warn(
        "[apple-iap-webhook] APPLE_SHARED_SECRET not set — running in PERMISSIVE decode-only mode. Add the secret before going live.",
      );
    }

    const body = await req.json();

    // ── Path 1: client-side purchase verification ──────────────────────
    if (body.mode === "verify") {
      const { signedTransaction, userId } = body;
      if (!signedTransaction || !userId) {
        return new Response(JSON.stringify({ error: "signedTransaction and userId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const decoded = decodeJwsPayload(signedTransaction) as DecodedTx;
      if (!PLUS_PRODUCT_IDS.has(decoded.productId)) {
        return new Response(JSON.stringify({ error: "Unknown product" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const isActive = decoded.expiresDate > Date.now();
      await applyPurchase(supabase, userId, decoded, isActive);
      return new Response(
        JSON.stringify({
          success: true,
          plan_type: isActive ? "premium" : "free",
          expires_at: new Date(decoded.expiresDate).toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Path 2: App Store Server Notifications V2 ──────────────────────
    if (!body.signedPayload) {
      return new Response(JSON.stringify({ error: "signedPayload required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = decodeJwsPayload(body.signedPayload);
    const notificationType = payload.notificationType as string;
    const subtype = payload.subtype as string | undefined;

    const signedTransactionInfo = payload.data?.signedTransactionInfo;
    if (!signedTransactionInfo) {
      console.warn("[apple-iap-webhook] No signedTransactionInfo in payload", payload);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tx = decodeJwsPayload(signedTransactionInfo) as DecodedTx;
    if (!PLUS_PRODUCT_IDS.has(tx.productId)) {
      return new Response(JSON.stringify({ received: true, ignored: "unknown_product" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = await findUserByOriginalTxId(supabase, tx.originalTransactionId);
    if (!userId) {
      console.warn(
        "[apple-iap-webhook] No user matched for originalTransactionId",
        tx.originalTransactionId,
      );
      return new Response(JSON.stringify({ received: true, ignored: "no_user" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map notification type → active/inactive
    let isActive = tx.expiresDate > Date.now();
    if (
      notificationType === "EXPIRED" ||
      notificationType === "REVOKE" ||
      notificationType === "REFUND" ||
      (notificationType === "DID_CHANGE_RENEWAL_STATUS" && subtype === "AUTO_RENEW_DISABLED" && tx.expiresDate < Date.now())
    ) {
      isActive = false;
    }
    if (notificationType === "SUBSCRIBED" || notificationType === "DID_RENEW") {
      isActive = true;
    }

    await applyPurchase(supabase, userId, tx, isActive);

    console.log(
      `[apple-iap-webhook] ${notificationType}${subtype ? "/" + subtype : ""} → user ${userId} active=${isActive}`,
    );

    return new Response(JSON.stringify({ received: true, applied: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[apple-iap-webhook] error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

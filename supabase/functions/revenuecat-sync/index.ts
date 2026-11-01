// Server-side verification of a RevenueCat (App Store) subscription for the
// signed-in user. Called by the iOS app right after a purchase, a restore, or
// whenever it needs the authoritative Plus status.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, json } from "../_shared/paystack.ts";

const ENTITLEMENT_ID = "entl269e323869"; // keep in sync with src/lib/revenuecat.ts

function entitlementsMatch(id?: string | null): boolean {
  return Boolean(id) && String(id).toLowerCase() === ENTITLEMENT_ID.toLowerCase();
}

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

  const { data: profile } = await admin
    .from("profiles")
    .select("is_tester, plan_type, plus_expires_at, plus_status")
    .eq("id", user.id)
    .maybeSingle();

  // Permanent testers are always premium.
  if (profile?.is_tester) {
    await admin
      .from("profiles")
      .update({ plan_type: "premium", plus_status: "tester", plus_expires_at: null })
      .eq("id", user.id);
    return json({ plan_type: "premium", expires_at: null, tester: true });
  }

  const secretKey = Deno.env.get("REVENUECAT_SECRET_KEY");
  if (!secretKey) {
    // Not configured yet — report the profile state without pretending to verify.
    const active =
      profile?.plan_type === "premium" &&
      (!profile?.plus_expires_at || new Date(profile.plus_expires_at).getTime() > Date.now());
    return json({
      configured: false,
      plan_type: active ? "premium" : "free",
      expires_at: profile?.plus_expires_at ?? null,
      error: "RevenueCat is not configured yet.",
    });
  }

  // Ask RevenueCat for this user's entitlements. The app passes the Supabase
  // user id as the RevenueCat external_id, so look up by that.
  let rc: any = null;
  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    if (res.ok) rc = await res.json();
  } catch {
    /* handled below */
  }

  const subs = rc?.subscriber;
  let ent: any = null;
  if (subs?.entitlements) {
    for (const [key, value] of Object.entries(subs.entitlements as Record<string, any>)) {
      if (entitlementsMatch(key)) ent = value;
    }
  }

  const now = Date.now();
  const expiresAt = ent?.expires_date ? new Date(ent.expires_date).getTime() : null;
  const active = Boolean(ent) && (!expiresAt || expiresAt > now);

  if (active && ent) {
    const { data: updated, error: updateError } = await admin
      .from("profiles")
      .update({
        plan_type: "premium",
        plus_provider: "revenuecat",
        plus_status: ent.will_renew === false ? "cancelled" : "active",
        plus_expires_at: ent.expires_date ?? null,
        plus_product_id: ent.product_identifier ?? null,
        plus_last_event: "sync",
      })
      .eq("id", user.id)
      .select("plan_type, plus_expires_at")
      .single();

    if (updateError) return json({ error: "Could not save your subscription." }, 500);
    return json({
      plan_type: updated?.plan_type ?? "premium",
      expires_at: updated?.plus_expires_at ?? null,
      store: ent.store ?? null,
      product_id: ent.product_identifier ?? null,
    });
  }

  // No active RevenueCat entitlement right now. Report the existing profile
  // state (webhooks are the source of truth for revocations) so a paid mum is
  // never wrongly locked out by a transient empty response.
  const stillActive =
    profile?.plan_type === "premium" &&
    profile?.plus_provider === "revenuecat" &&
    (!profile?.plus_expires_at || new Date(profile.plus_expires_at).getTime() > now);
  return json({
    plan_type: stillActive ? "premium" : "free",
    expires_at: stillActive ? profile?.plus_expires_at ?? null : null,
  });
});

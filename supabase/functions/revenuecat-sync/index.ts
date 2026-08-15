// RevenueCat entitlement sync — called by the app right after a purchase or
// restore so Plus unlocks immediately instead of waiting for the webhook.
// Reads the caller's subscriber record from the RevenueCat REST API using
// REVENUECAT_SECRET_KEY and mirrors the "Pro" entitlement onto profiles.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// RevenueCat APIs return the public entitlement identifier, not its dashboard API id.
const PRO_ENTITLEMENT = "pro";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

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

  // Permanent test accounts always resolve to premium.
  const { data: profile } = await admin
    .from("profiles")
    .select("is_tester")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_tester) {
    await admin
      .from("profiles")
      .update({ plan_type: "premium", plus_status: "tester", plus_expires_at: null })
      .eq("id", user.id);
    return json({ plan_type: "premium", expires_at: null, tester: true });
  }

  const secretKey = Deno.env.get("REVENUECAT_SECRET_KEY");
  if (!secretKey) return json({ error: "RevenueCat is not configured yet." }, 503);

  const rcRes = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  if (!rcRes.ok) {
    const text = await rcRes.text();
    console.error("[revenuecat-sync] RC API error", rcRes.status, text);
    return json({ error: "Could not reach the store right now." }, 502);
  }

  const payload = await rcRes.json();
  const allEntitlements = payload?.subscriber?.entitlements ?? {};
  const key = Object.keys(allEntitlements).find((k) => k.toLowerCase() === PRO_ENTITLEMENT);
  const entitlement = key ? allEntitlements[key] : null;

  const expiresAt: string | null = entitlement?.expires_date ?? null;
  const isActive = Boolean(entitlement) && (!expiresAt || new Date(expiresAt).getTime() > Date.now());

  const { error } = await admin
    .from("profiles")
    .update({
      plan_type: isActive ? "premium" : "free",
      plus_provider: "revenuecat",
      plus_expires_at: expiresAt,
      plus_product_id: entitlement?.product_identifier ?? null,
      plus_status: isActive ? "active" : "expired",
      plus_last_event: "sync",
    })
    .eq("id", user.id);

  if (error) return json({ error: error.message }, 500);

  return json({ plan_type: isActive ? "premium" : "free", expires_at: expiresAt });
});

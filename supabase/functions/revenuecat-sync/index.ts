// RevenueCat entitlement sync — called by the app right after a purchase or
// restore so premium unlocks immediately instead of waiting for the webhook.
// Reads the caller's subscriber record from the RevenueCat REST API using
// REVENUECAT_SECRET_KEY and mirrors the `plus` entitlement onto profiles.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLUS_ENTITLEMENT = "plus";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const secretKey = Deno.env.get("REVENUECAT_SECRET_KEY");
  if (!secretKey) return json({ error: "RevenueCat is not configured yet." }, 503);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const rcRes = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  if (!rcRes.ok) {
    const text = await rcRes.text();
    console.error("[revenuecat-sync] RC API error", rcRes.status, text);
    return json({ error: "Could not reach the store right now." }, 502);
  }

  const payload = await rcRes.json();
  const entitlement = payload?.subscriber?.entitlements?.[PLUS_ENTITLEMENT];
  const expiresAt: string | null = entitlement?.expires_date ?? null;
  const isActive = Boolean(entitlement) && (!expiresAt || new Date(expiresAt).getTime() > Date.now());

  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await admin
    .from("profiles")
    .update({
      plan_type: isActive ? "premium" : "free",
      plus_provider: "revenuecat",
      plus_expires_at: expiresAt,
    })
    .eq("id", user.id);

  if (error) return json({ error: error.message }, 500);

  return json({ plan_type: isActive ? "premium" : "free", expires_at: expiresAt });
});

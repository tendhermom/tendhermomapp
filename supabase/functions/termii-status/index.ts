import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE = "https://v3.api.termii.com";

async function getJson(url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  } catch (err) {
    return { status: 0, body: { error: String(err) } };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);

    // Admin-only diagnostics
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const apiKey = Deno.env.get("TERMII_API_KEY");
    if (!apiKey) return json({ error: "TERMII_API_KEY is not configured" }, 500);

    const [balance, senders, history] = await Promise.all([
      getJson(`${BASE}/api/get-balance?api_key=${apiKey}`),
      getJson(`${BASE}/api/sender-id?api_key=${apiKey}`),
      getJson(`${BASE}/api/sms/inbox?api_key=${apiKey}`),
    ]);

    return json({
      balance: balance.body,
      sender_ids: senders.body,
      recent_messages: history.body,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[termii-status] Error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});

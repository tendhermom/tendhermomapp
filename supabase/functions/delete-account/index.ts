import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Soft-deletes the authenticated user's account by stamping `deletion_requested_at`.
 * The actual purge happens 7 days later via the `purge-deleted-accounts` edge function
 * triggered by pg_cron. Until then the user can sign in to cancel.
 *
 * Body (optional):
 *   { cancel: true }  -> clears `deletion_requested_at` (recover account)
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional cancel path
    let cancel = false;
    try {
      if (req.headers.get("content-type")?.includes("application/json")) {
        const body = await req.json();
        cancel = body?.cancel === true;
      }
    } catch (_) { /* no body is fine */ }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (cancel) {
      const { error } = await adminClient
        .from("profiles")
        .update({ deletion_requested_at: null })
        .eq("id", user.id);
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, cancelled: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Soft-delete: stamp the request time. The purge job handles the rest.
    const { error: stampError } = await adminClient
      .from("profiles")
      .update({ deletion_requested_at: new Date().toISOString() })
      .eq("id", user.id);

    if (stampError) {
      console.error("Failed to stamp deletion_requested_at:", stampError);
      return new Response(
        JSON.stringify({ error: "Failed to schedule deletion" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const purgeAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return new Response(
      JSON.stringify({
        success: true,
        scheduled: true,
        purge_at: purgeAt,
        grace_days: 7,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Delete account error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

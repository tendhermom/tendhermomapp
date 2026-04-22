import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Scheduled purge job. Finds profiles with `deletion_requested_at` older than 7 days
 * and deletes all their data + auth records.
 *
 * Triggered by pg_cron once per hour. Idempotent; safe to retry.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Find accounts that have been pending deletion for 7+ days
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: pending, error: fetchError } = await admin
      .from("profiles")
      .select("id")
      .lt("deletion_requested_at", cutoff)
      .not("deletion_requested_at", "is", null)
      .limit(50); // batch to keep job under the runtime budget

    if (fetchError) {
      console.error("Failed to query pending deletions:", fetchError);
      return new Response(
        JSON.stringify({ error: "Query failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!pending || pending.length === 0) {
      return new Response(
        JSON.stringify({ purged: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Tables keyed by user_id (order matters where FKs exist)
    const userTables = [
      "post_comments",
      "post_likes",
      "reactions",
      "community_posts",
      "community_memberships",
      "community_points",
      "baby_shower_posts",
      "emergency_contacts",
      "emergency_alerts",
      "inactivity_alerts",
      "notifications",
      "triage_sessions",
      "health_metrics",
      "referrals",
      "user_roles",
      "rate_limits",
      "reported_posts",
    ];

    const results: { id: string; ok: boolean; error?: string }[] = [];

    for (const row of pending) {
      const userId = row.id;
      try {
        for (const table of userTables) {
          await admin.from(table).delete().eq("user_id", userId);
        }
        // Reports filed BY this user
        await admin.from("reported_posts").delete().eq("reporter_id", userId);
        // Profile row uses `id`
        await admin.from("profiles").delete().eq("id", userId);
        // Auth user
        const { error: authError } = await admin.auth.admin.deleteUser(userId);
        if (authError) throw authError;

        results.push({ id: userId, ok: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Failed to purge ${userId}:`, msg);
        results.push({ id: userId, ok: false, error: msg });
      }
    }

    const purged = results.filter((r) => r.ok).length;
    const failed = results.length - purged;

    return new Response(
      JSON.stringify({ purged, failed, total_candidates: pending.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Purge job error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

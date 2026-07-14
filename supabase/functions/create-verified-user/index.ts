import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { email, password, code, full_name, phone } = await req.json();
    if (!email || !password || !code) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normEmail = email.trim().toLowerCase();

    // Verify the OTP code — accept verified OR unverified codes within a 30 min window
    // so users can retry safely if the first attempt failed mid-flight.
    const windowStart = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: vrow, error: vErr } = await admin
      .from("email_verifications")
      .select("*")
      .eq("email", normEmail)
      .eq("code", code)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (vErr || !vrow) {
      return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!vrow.verified) {
      await admin.from("email_verifications").update({ verified: true }).eq("id", vrow.id);
    }

    const userMetadata = {
      full_name: full_name?.trim() || "",
      phone: phone?.replace(/\s/g, "") || "",
      user_type: "mother",
    };

    const createFresh = async () =>
      admin.auth.admin.createUser({
        email: normEmail,
        password,
        email_confirm: true,
        user_metadata: userMetadata,
      });

    // Try to create user with email already confirmed
    let { data: created, error: createErr } = await createFresh();

    if (createErr) {
      const msg = (createErr.message || "").toLowerCase();
      const alreadyExists =
        msg.includes("already") || msg.includes("registered") || msg.includes("exists");

      if (alreadyExists) {
        // Look up the existing auth user
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const existing = list?.users?.find(
          (u) => (u.email || "").toLowerCase() === normEmail,
        );

        if (existing) {
          // Check if this account is soft-deleted (pending purge). If so, wipe
          // the old account completely and create a fresh one with the new password
          // so the user isn't stuck with an unusable email.
          const { data: prof } = await admin
            .from("profiles")
            .select("deletion_requested_at")
            .eq("id", existing.id)
            .maybeSingle();

          const isSoftDeleted = !!prof?.deletion_requested_at;

          if (isSoftDeleted) {
            try {
              await admin.rpc("purge_user_data", { _user_id: existing.id });
            } catch (e) {
              console.error("purge_user_data failed:", e);
            }
            const { error: delErr } = await admin.auth.admin.deleteUser(existing.id);
            if (delErr) {
              return new Response(
                JSON.stringify({ error: "Could not reset previous account. Please contact support." }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
              );
            }
            const retry = await createFresh();
            if (retry.error) {
              return new Response(JSON.stringify({ error: retry.error.message }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            created = retry.data;
          } else {
            // Genuinely existing active account — tell the user to sign in / reset password.
            return new Response(
              JSON.stringify({
                error: "An account with this email already exists. Please sign in or reset your password.",
              }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
        } else {
          return new Response(JSON.stringify({ error: createErr.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, user_id: created.user?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

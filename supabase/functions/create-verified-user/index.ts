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

    // Try to create user with email already confirmed
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name?.trim() || "",
        phone: phone?.replace(/\s/g, "") || "",
        user_type: "mother",
      },
    });

    if (createErr) {
      const msg = (createErr.message || "").toLowerCase();
      // If the user already exists, treat as success — they completed signup before.
      // The client will sign in with the password they provided. If the password
      // doesn't match the prior account, sign-in will produce a clear error there.
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return new Response(JSON.stringify({ success: true, already_existed: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

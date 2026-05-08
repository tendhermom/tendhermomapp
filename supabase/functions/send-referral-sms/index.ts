import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TERMII_API_URL = "https://v3.api.termii.com/api/sms/send";
const SMS_SENDER_ID = "TendherMom";
const APP_LINK = "https://tendhermomapps.lovable.app";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: max 10 referral SMS per hour per user
    const { data: allowed } = await serviceClient.rpc("check_rate_limit", {
      _user_id: userData.user.id,
      _action: "referral_sms",
      _max_requests: 10,
      _window_minutes: 60,
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Too many invites sent. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { phone, referrer_name } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const TERMII_API_KEY = Deno.env.get("TERMII_API_KEY");
    if (!TERMII_API_KEY) {
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const senderName = referrer_name || "A friend";
    const message = `${senderName} invited you to join TendherMom — maternal health support built for Nigerian mothers. Download now: ${APP_LINK}`;

    const termiiPayload = {
      api_key: TERMII_API_KEY,
      to: phone.replace(/\s+/g, ""),
      from: SMS_SENDER_ID,
      sms: message,
      type: "plain",
      channel: "dnd",
    };

    const response = await fetch(TERMII_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(termiiPayload),
      signal: AbortSignal.timeout(8000),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Termii error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send SMS", details: result }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Referral SMS error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

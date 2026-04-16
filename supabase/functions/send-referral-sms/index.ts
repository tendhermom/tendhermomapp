import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

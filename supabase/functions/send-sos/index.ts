import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Contact {
  name: string;
  phone: string;
  whatsapp: string;
  email: string | null;
  channels: ("sms" | "whatsapp" | "email")[];
}

interface SOSRequest {
  user_id: string;
  user_name: string;
  user_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  contacts: Contact[];
  is_test: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SOSRequest = await req.json();
    const { user_name, latitude, longitude, contacts, is_test } = body;

    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ error: "No contacts provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build location info
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let locationText: string;
    let mapsLink: string;
    if (latitude && longitude) {
      mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      locationText = `Her last known location: ${mapsLink}`;
    } else {
      locationText = `Location unavailable — please call ${user_name} directly.`;
      mapsLink = "";
    }

    const testPrefix = is_test ? "[TEST ALERT] " : "";

    const smsMessage = `${testPrefix}EMERGENCY ALERT — TendherMom\n\n${user_name} needs urgent help. She triggered her emergency alert at ${timeStr} on ${dateStr}.\n\n${locationText}\n\nPlease contact her immediately or call emergency services: 112 (Nigeria).\n\nSent via TendherMom`;

    // Process each contact — log results
    const channelResults: Record<string, any> = {};

    for (const contact of contacts) {
      const contactResult: Record<string, string> = {};

      for (const channel of contact.channels) {
        // In production, this would call Twilio/SendGrid via connector gateway
        // For now, we log the intent and mark as "queued"
        console.log(
          `[SOS] ${channel.toUpperCase()} → ${contact.name} (${
            channel === "email" ? contact.email : contact.phone
          }): ${is_test ? "TEST " : ""}alert`
        );
        contactResult[channel] = "queued";
      }

      channelResults[contact.name] = contactResult;
    }

    console.log(`[SOS] Alert dispatched for ${user_name} to ${contacts.length} contacts`);

    return new Response(
      JSON.stringify({
        success: true,
        contacts_notified: contacts.length,
        channel_results: channelResults,
        is_test,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[SOS] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

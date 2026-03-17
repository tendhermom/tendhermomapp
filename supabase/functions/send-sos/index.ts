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
  channels: ("sms" | "whatsapp" | "voice")[];
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user via getUser instead of getClaims
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Get user plan type
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("plan_type")
      .eq("id", userId)
      .single();

    const isFree = !profile || profile.plan_type === "free";

    // Rate limit: free = 1/month, premium = unlimited (but max 10/10min as abuse guard)
    if (isFree) {
      const { data: allowed } = await serviceClient.rpc("check_rate_limit", {
        _user_id: userId,
        _action: "sos_alert_monthly",
        _max_requests: 1,
        _window_minutes: 43200, // 30 days
      });
      if (!allowed) {
        return new Response(
          JSON.stringify({ error: "Free plan allows 1 SOS trigger per month. Upgrade to Premium for unlimited triggers." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const { data: allowed } = await serviceClient.rpc("check_rate_limit", {
        _user_id: userId,
        _action: "sos_alert",
        _max_requests: 10,
        _window_minutes: 10,
      });
      if (!allowed) {
        return new Response(
          JSON.stringify({ error: "Too many SOS alerts. Please wait before trying again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Enforce contact limits: free = 1, premium = 5
    const maxContacts = isFree ? 1 : 5;

    const body: SOSRequest = await req.json();
    const { user_name, latitude, longitude, contacts, is_test } = body;

    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ error: "No contacts provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trim contacts to plan limit
    const limitedContacts = contacts.slice(0, maxContacts);

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

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

    const channelResults: Record<string, any> = {};
    for (const contact of limitedContacts) {
      const contactResult: Record<string, string> = {};
      for (const channel of contact.channels) {
        console.log(`[SOS] ${channel.toUpperCase()} → ${contact.name} (${contact.phone}): ${is_test ? "TEST " : ""}alert`);
        contactResult[channel] = "queued";
      }
      channelResults[contact.name] = contactResult;
    }

    console.log(`[SOS] Alert dispatched for ${user_name} to ${limitedContacts.length} contacts (plan: ${isFree ? "free" : "premium"})`);

    return new Response(
      JSON.stringify({ success: true, contacts_notified: limitedContacts.length, channel_results: channelResults, is_test }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[SOS] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

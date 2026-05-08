import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TERMII_API_URL = "https://v3.api.termii.com/api/sms/send";
const SMS_SENDER_ID = "TendherMom";

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

async function sendTermiiSMS(phone: string, message: string, apiKey: string): Promise<{ success: boolean; response?: any; error?: string }> {
  try {
    const response = await fetch(TERMII_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone,
        from: SMS_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "dnd",
        api_key: apiKey,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`[SOS] Termii SMS failed for ${phone}:`, data);
      return { success: false, error: `HTTP ${response.status}`, response: data };
    }
    console.log(`[SOS] Termii SMS sent to ${phone}:`, data);
    return { success: true, response: data };
  } catch (err) {
    console.error(`[SOS] Termii SMS error for ${phone}:`, err);
    return { success: false, error: String(err) };
  }
}

async function sendTermiiWhatsApp(phone: string, message: string, apiKey: string): Promise<{ success: boolean; response?: any; error?: string }> {
  // WhatsApp requires a configured device on Termii dashboard
  // When the device is set up, this will use the whatsapp channel
  try {
    const response = await fetch(TERMII_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone,
        from: SMS_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "whatsapp",
        api_key: apiKey,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`[SOS] Termii WhatsApp failed for ${phone}:`, data);
      return { success: false, error: `HTTP ${response.status}`, response: data };
    }
    console.log(`[SOS] Termii WhatsApp sent to ${phone}:`, data);
    return { success: true, response: data };
  } catch (err) {
    console.error(`[SOS] Termii WhatsApp error for ${phone}:`, err);
    return { success: false, error: String(err) };
  }
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

    const termiiApiKey = Deno.env.get("TERMII_API_KEY");
    if (!termiiApiKey) {
      console.error("[SOS] TERMII_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "SMS service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // SOS is FREE for everyone — only an abuse-guard rate limit (max 10 / 10 min)
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

    // Everyone can notify up to 5 contacts
    const maxContacts = 5;

    const body: SOSRequest = await req.json();
    const { user_name, latitude, longitude, contacts, is_test } = body;

    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ error: "No contacts provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Dispatch messages in parallel to all contacts across all channels
    const channelResults: Record<string, Record<string, string>> = {};
    const dispatchPromises: Promise<void>[] = [];

    for (const contact of limitedContacts) {
      channelResults[contact.name] = {};

      for (const channel of contact.channels) {
        if (channel === "sms") {
          dispatchPromises.push(
            sendTermiiSMS(contact.phone, smsMessage, termiiApiKey).then((result) => {
              channelResults[contact.name]["sms"] = result.success ? "sent" : `failed: ${result.error}`;
            })
          );
        } else if (channel === "whatsapp") {
          const whatsappNumber = contact.whatsapp || contact.phone;
          dispatchPromises.push(
            sendTermiiWhatsApp(whatsappNumber, smsMessage, termiiApiKey).then((result) => {
              channelResults[contact.name]["whatsapp"] = result.success ? "sent" : `failed: ${result.error}`;
            })
          );
        } else if (channel === "voice") {
          // Voice calls not yet implemented — log and mark as unsupported
          console.log(`[SOS] Voice call to ${contact.name} (${contact.phone}) — not yet implemented`);
          channelResults[contact.name]["voice"] = "unsupported";
        }
      }
    }

    // Wait for all dispatches to complete
    await Promise.allSettled(dispatchPromises);

    // Log the alert to the database
    await serviceClient.from("emergency_alerts").insert({
      user_id: userId,
      latitude,
      longitude,
      contacts_notified: limitedContacts.length,
      channel_success: channelResults,
      is_test,
    });

    const successCount = Object.values(channelResults).reduce((acc, channels) => {
      return acc + Object.values(channels).filter((s) => s === "sent").length;
    }, 0);

    console.log(`[SOS] Alert dispatched for ${user_name} — ${successCount} message(s) sent to ${limitedContacts.length} contact(s)`);

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

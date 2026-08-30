import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TERMII_API_URL = "https://v3.api.termii.com/api/sms/send";
const SMS_SENDER_ID = "TendherMom";
// Termii's pre-approved transactional sender — always usable, bypasses DND.
const FALLBACK_SENDER_ID = "N-Alert";

// Sender ID + route ladder. First accepted combination wins; we record which
// one worked so the logs show what actually delivers on this account.
const SMS_LADDER: { from: string; channel: "dnd" | "generic" }[] = [
  { from: SMS_SENDER_ID, channel: "dnd" },
  { from: FALLBACK_SENDER_ID, channel: "dnd" },
  { from: FALLBACK_SENDER_ID, channel: "generic" },
];

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

// Termii requires the destination in international format WITHOUT a "+"
// (docs example: "23490126727"). Contacts are stored as "+234 ..." or
// local "0801 ...", so normalize before every send.
function normalizeNgPhone(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  return digits;
}

interface TermiiResult {
  success: boolean;
  response?: unknown;
  error?: string;
  message_id?: string;
  sender?: string;
  route?: string;
}

async function termiiAttempt(
  to: string,
  message: string,
  apiKey: string,
  channel: "dnd" | "generic" | "whatsapp",
  from: string,
): Promise<TermiiResult> {
  try {
    const response = await fetch(TERMII_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        from,
        sms: message,
        type: "plain",
        channel,
        api_key: apiKey,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const data = await response.json().catch(() => ({}));
    // Termii only truly queues a message when it returns a message_id.
    // Anything else (even HTTP 200) is a soft rejection.
    const messageId = data?.message_id ?? data?.["message_id"];
    const accepted = response.ok && !!messageId && !data?.error;
    if (!accepted) {
      const reason = data?.message || data?.error || `HTTP ${response.status}`;
      console.error(`[SOS] Termii rejected ${to} (from=${from}, route=${channel}):`, data);
      return { success: false, error: String(reason), response: data, sender: from, route: channel };
    }
    console.log(`[SOS] Termii accepted ${to} (from=${from}, route=${channel}) id=${messageId}`);
    return { success: true, response: data, message_id: String(messageId), sender: from, route: channel };
  } catch (err) {
    console.error(`[SOS] Termii error for ${to} (from=${from}, route=${channel}):`, err);
    return { success: false, error: String(err), sender: from, route: channel };
  }
}

async function sendTermiiSMS(phone: string, message: string, apiKey: string): Promise<TermiiResult> {
  const to = normalizeNgPhone(phone);
  if (!to) return { success: false, error: "invalid phone number" };
  // Walk the sender/route ladder: our own sender ID first, then Termii's
  // always-approved transactional sender, then the generic route.
  let last: TermiiResult = { success: false, error: "no attempt made" };
  for (const step of SMS_LADDER) {
    last = await termiiAttempt(to, message, apiKey, step.channel, step.from);
    if (last.success) return last;
    console.warn(`[SOS] ${step.from}/${step.channel} failed for ${to}: ${last.error}`);
  }
  return last;
}

async function sendTermiiWhatsApp(phone: string, message: string, apiKey: string): Promise<TermiiResult> {
  // WhatsApp requires a configured device on the Termii dashboard; `from`
  // must be that device name once it exists.
  const to = normalizeNgPhone(phone);
  if (!to) return { success: false, error: "invalid phone number" };
  return termiiAttempt(to, message, apiKey, "whatsapp", SMS_SENDER_ID);
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

    if (body.user_id !== userId || !user_name || typeof user_name !== "string" || user_name.length > 120) {
      return new Response(JSON.stringify({ error: "Invalid alert details" }), {
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

    if (successCount === 0) {
      // Surface the first real rejection reason so the client can show why
      // delivery failed (e.g. unregistered sender ID, invalid number).
      const firstFailure = Object.values(channelResults)
        .flatMap((channels) => Object.values(channels))
        .find((s) => s.startsWith("failed: "));
      const detail = firstFailure ? firstFailure.replace(/^failed: /, "") : "unknown delivery error";
      return new Response(
        JSON.stringify({ error: "No emergency messages could be delivered", detail, channel_results: channelResults }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, contacts_notified: limitedContacts.length, messages_sent: successCount, channel_results: channelResults, is_test }),
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

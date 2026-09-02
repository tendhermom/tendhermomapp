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
// Verified live on this Termii account (30 Aug 2026): sender ID "TendherMom"
// is ACTIVE and the generic route delivers; the dnd route is not enabled, so
// it is tried first (best for DND-registered numbers) and then falls through.
const SMS_LADDER: { from: string; channel: "dnd" | "generic" }[] = [
  { from: SMS_SENDER_ID, channel: "dnd" },
  { from: SMS_SENDER_ID, channel: "generic" },
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

// Turn a GPS fix into a short human place ("Unguwan Rimi, Kaduna").
// Never allowed to delay a life-safety message: hard 3s timeout, and any
// failure simply drops the place from the text.
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!key) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=neighborhood|sublocality|locality|administrative_area_level_2|administrative_area_level_1&key=${key}`,
      { signal: AbortSignal.timeout(3000) },
    );
    const data = await res.json().catch(() => null);
    const results: { address_components?: { long_name: string; types: string[] }[] }[] =
      data?.results ?? [];
    if (!results.length) return null;

    const pick = (types: string[]) => {
      for (const r of results) {
        for (const c of r.address_components ?? []) {
          if (c.types.some((t) => types.includes(t))) return c.long_name;
        }
      }
      return null;
    };

    const area = pick(["neighborhood", "sublocality", "sublocality_level_1"]);
    const city = pick(["locality", "administrative_area_level_2", "administrative_area_level_1"]);
    const label = [area, city].filter(Boolean).join(", ");
    return label || null;
  } catch (err) {
    console.warn("[SOS] reverse geocode failed:", err);
    return null;
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

    if (body.user_id !== userId || !user_name || typeof user_name !== "string" || user_name.length > 120) {
      return new Response(JSON.stringify({ error: "Invalid alert details" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const limitedContacts = contacts.slice(0, maxContacts);

    const now = new Date();

    // ── Build the Termii-approved SOS message ────────────────────────────
    // "SOS: Amina, 32 weeks pregnant needs urgent help at Unguwan Rimi,
    //  Kaduna. Call 2348012345678. Map: <link>. Pls respond. Powered by
    //  TendherMom"
    // Every segment is optional-safe so the text stays valid when a piece
    // (GPS, phone, dates) is missing.
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("full_name, phone, lmp_date, due_date, current_stage")
      .eq("id", userId)
      .maybeSingle();

    const firstName = String(profile?.full_name || user_name || "A mum").trim().split(/\s+/)[0];

    const stagePhrase = (() => {
      const lmp = profile?.lmp_date ? new Date(profile.lmp_date as string) : null;
      const due = profile?.due_date ? new Date(profile.due_date as string) : null;
      let weeks: number | null = null;
      if (lmp && !isNaN(lmp.getTime())) {
        weeks = Math.floor((now.getTime() - lmp.getTime()) / (7 * 24 * 60 * 60 * 1000));
      } else if (due && !isNaN(due.getTime())) {
        weeks = 40 - Math.floor((due.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000));
      }
      if (profile?.current_stage === "postpartum" || (weeks !== null && weeks > 42)) {
        return "recently delivered";
      }
      if (weeks !== null && weeks >= 1 && weeks <= 42) return `${weeks} weeks pregnant`;
      return "";
    })();

    const placeName = latitude && longitude ? await reverseGeocode(latitude, longitude) : null;
    const mapsLink = latitude && longitude ? `https://maps.google.com/?q=${latitude},${longitude}` : "";

    const callNumber = normalizeNgPhone(String(profile?.phone || body.user_phone || ""));

    const subject = stagePhrase ? `${firstName}, ${stagePhrase}` : firstName;
    const parts: string[] = [
      `SOS: ${subject} needs urgent help${placeName ? ` at ${placeName}` : ""}.`,
    ];
    if (callNumber) parts.push(`Call ${callNumber}.`);
    if (mapsLink) parts.push(`Map: ${mapsLink}.`);
    parts.push("Pls respond. Powered by TendherMom");

    const smsMessage = `${is_test ? "[TEST] " : ""}${parts.join(" ")}`;

    // Dispatch messages in parallel to all contacts across all channels
    const channelResults: Record<string, Record<string, string>> = {};
    // Structured delivery records so the client can render a per-contact
    // status panel with the Termii message_id or the exact error.
    const deliveries: {
      contact: string;
      channel: string;
      success: boolean;
      message_id?: string;
      sender?: string;
      route?: string;
      error?: string;
    }[] = [];
    const dispatchPromises: Promise<void>[] = [];

    for (const contact of limitedContacts) {
      channelResults[contact.name] = {};

      for (const channel of contact.channels) {
        if (channel === "sms") {
          dispatchPromises.push(
            sendTermiiSMS(contact.phone, smsMessage, termiiApiKey).then((result) => {
              channelResults[contact.name]["sms"] = result.success
                ? `sent via ${result.sender}/${result.route} id=${result.message_id}`
                : `failed: ${result.error}`;
              deliveries.push({
                contact: contact.name,
                channel: "sms",
                success: result.success,
                message_id: result.message_id,
                sender: result.sender,
                route: result.route,
                error: result.error,
              });
            })
          );
        } else if (channel === "whatsapp") {
          const whatsappNumber = contact.whatsapp || contact.phone;
          dispatchPromises.push(
            sendTermiiWhatsApp(whatsappNumber, smsMessage, termiiApiKey).then((result) => {
              channelResults[contact.name]["whatsapp"] = result.success ? "sent" : `failed: ${result.error}`;
              deliveries.push({
                contact: contact.name,
                channel: "whatsapp",
                success: result.success,
                message_id: result.message_id,
                sender: result.sender,
                route: result.route,
                error: result.error,
              });
            })
          );
        } else if (channel === "voice") {
          // Voice calls not yet implemented — log and mark as unsupported
          console.log(`[SOS] Voice call to ${contact.name} (${contact.phone}) — not yet implemented`);
          channelResults[contact.name]["voice"] = "unsupported";
          deliveries.push({ contact: contact.name, channel: "voice", success: false, error: "Voice calls coming soon" });
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
      return acc + Object.values(channels).filter((s) => s.startsWith("sent")).length;
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
        JSON.stringify({ error: "No emergency messages could be delivered", detail, channel_results: channelResults, deliveries }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        contacts_notified: limitedContacts.length,
        messages_sent: successCount,
        channel_results: channelResults,
        deliveries,
        sent_at: now.toISOString(),
        is_test,
      }),
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

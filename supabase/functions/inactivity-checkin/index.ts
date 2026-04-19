// Background job: detects mums who haven't opened the app in >=48h and sends
// an SMS wellness check-in to up to 2 of their emergency contacts (primary first).
// Triggered hourly by pg_cron. Idempotent: skips contacts already pinged for
// this inactivity streak (within the last 5 days).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TERMII_API_URL = "https://v3.api.termii.com/api/sms/send";
const SMS_SENDER_ID = "TendherMom";
const INACTIVITY_THRESHOLD_HOURS = 48;
const RECENT_ALERT_WINDOW_DAYS = 5; // don't re-alert same contact within 5 days
const MAX_CONTACTS_PER_USER = 2;
const MAX_USERS_PER_RUN = 200; // safety cap per cron tick

interface Profile {
  id: string;
  full_name: string;
  last_active_at: string;
}

interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  is_primary: boolean;
  sms_enabled: boolean;
}

async function sendTermiiSMS(
  phone: string,
  message: string,
  apiKey: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const resp = await fetch(TERMII_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone.replace(/\s+/g, ""),
        from: SMS_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "dnd",
        api_key: apiKey,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return { success: false, error: `HTTP ${resp.status}: ${JSON.stringify(data)}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const termiiKey = Deno.env.get("TERMII_API_KEY");

    if (!termiiKey) {
      console.error("[inactivity-checkin] TERMII_API_KEY missing");
      return new Response(JSON.stringify({ error: "SMS service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // 1. Find inactive mums
    const cutoff = new Date(Date.now() - INACTIVITY_THRESHOLD_HOURS * 60 * 60 * 1000).toISOString();
    const { data: profiles, error: profilesErr } = await admin
      .from("profiles")
      .select("id, full_name, last_active_at")
      .lt("last_active_at", cutoff)
      .limit(MAX_USERS_PER_RUN);

    if (profilesErr) {
      console.error("[inactivity-checkin] profiles query failed:", profilesErr);
      return new Response(JSON.stringify({ error: "DB error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ checked: 0, dispatched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recentWindow = new Date(
      Date.now() - RECENT_ALERT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    let dispatched = 0;
    const skipped: string[] = [];

    for (const profile of profiles as Profile[]) {
      const inactiveHours = Math.floor(
        (Date.now() - new Date(profile.last_active_at).getTime()) / (60 * 60 * 1000),
      );

      // Pull contacts (primary first), only SMS-enabled
      const { data: contacts } = await admin
        .from("emergency_contacts")
        .select("id, user_id, name, phone, is_primary, sms_enabled")
        .eq("user_id", profile.id)
        .eq("sms_enabled", true)
        .order("is_primary", { ascending: false })
        .limit(MAX_CONTACTS_PER_USER);

      if (!contacts || contacts.length === 0) {
        skipped.push(`${profile.id}:no-contacts`);
        continue;
      }

      // Skip contacts already alerted in the last 5 days for this user
      const { data: recent } = await admin
        .from("inactivity_alerts")
        .select("contact_id")
        .eq("user_id", profile.id)
        .gte("sent_at", recentWindow);

      const alreadyAlerted = new Set((recent || []).map((r) => r.contact_id));
      const targets = (contacts as Contact[]).filter((c) => !alreadyAlerted.has(c.id));

      if (targets.length === 0) {
        skipped.push(`${profile.id}:already-alerted`);
        continue;
      }

      const firstName = (profile.full_name || "Your loved one").split(" ")[0];
      const days = Math.floor(inactiveHours / 24);
      const message =
        `${firstName} hasn't opened TendherMom in ${days} day${days !== 1 ? "s" : ""}. ` +
        `Can you please check on her? She may need support. — TendherMom`;

      for (const contact of targets) {
        const result = await sendTermiiSMS(contact.phone, message, termiiKey);
        await admin.from("inactivity_alerts").insert({
          user_id: profile.id,
          contact_id: contact.id,
          contact_phone: contact.phone,
          contact_name: contact.name,
          inactive_hours: inactiveHours,
          channel: "sms",
          status: result.success ? "sent" : "failed",
          error: result.error || null,
        });
        if (result.success) dispatched++;
      }
    }

    console.log(
      `[inactivity-checkin] checked=${profiles.length} dispatched=${dispatched} skipped=${skipped.length}`,
    );

    return new Response(
      JSON.stringify({
        checked: profiles.length,
        dispatched,
        skipped: skipped.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[inactivity-checkin] fatal:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

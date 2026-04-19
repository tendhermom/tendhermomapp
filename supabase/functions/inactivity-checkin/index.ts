// Background job: two-tier inactivity safety net.
// - At 24h-47h inactive: gentle in-app notification ("We miss you, tap to check in")
//   inserted into the notifications table (delivered as push by OneSignal listeners).
// - At 48h+ inactive: SMS wellness check-in to up to 2 emergency contacts (primary first).
// Triggered hourly by pg_cron. Idempotent within each tier.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TERMII_API_URL = "https://v3.api.termii.com/api/sms/send";
const SMS_SENDER_ID = "TendherMom";
const SELF_CHECKIN_HOURS = 24;
const ESCALATION_HOURS = 48;
const RECENT_ALERT_WINDOW_DAYS = 5; // don't re-alert same contact within 5 days
const SELF_CHECKIN_COOLDOWN_HOURS = 20; // don't re-ping the mum more than ~once a day
const MAX_CONTACTS_PER_USER = 2;
const MAX_USERS_PER_RUN = 200; // safety cap per cron tick

interface Profile {
  id: string;
  full_name: string;
  last_active_at: string;
  inactivity_alerts_enabled?: boolean | null;
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

    const admin = createClient(supabaseUrl, serviceKey);

    // Pull anyone inactive >= 24h. We branch by hours below.
    const selfCutoff = new Date(Date.now() - SELF_CHECKIN_HOURS * 60 * 60 * 1000).toISOString();
    const { data: profiles, error: profilesErr } = await admin
      .from("profiles")
      .select("id, full_name, last_active_at, inactivity_alerts_enabled")
      .lt("last_active_at", selfCutoff)
      .limit(MAX_USERS_PER_RUN);

    if (profilesErr) {
      console.error("[inactivity-checkin] profiles query failed:", profilesErr);
      return new Response(JSON.stringify({ error: "DB error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ checked: 0, selfPushed: 0, dispatched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recentWindow = new Date(
      Date.now() - RECENT_ALERT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    const selfCooldownWindow = new Date(
      Date.now() - SELF_CHECKIN_COOLDOWN_HOURS * 60 * 60 * 1000,
    ).toISOString();

    let selfPushed = 0;
    let dispatched = 0;
    const skipped: string[] = [];

    for (const profile of profiles as Profile[]) {
      const inactiveHours = Math.floor(
        (Date.now() - new Date(profile.last_active_at).getTime()) / (60 * 60 * 1000),
      );

      // ─── TIER 1: 24h–47h gentle self check-in ───
      if (inactiveHours < ESCALATION_HOURS) {
        // Cooldown: skip if we already self-pinged her recently
        const { data: recentSelf } = await admin
          .from("inactivity_alerts")
          .select("id")
          .eq("user_id", profile.id)
          .eq("channel", "self-push")
          .gte("sent_at", selfCooldownWindow)
          .limit(1);

        if (recentSelf && recentSelf.length > 0) {
          skipped.push(`${profile.id}:self-cooldown`);
          continue;
        }

        const firstName = (profile.full_name || "Mum").split(" ")[0];
        const { error: notifErr } = await admin.from("notifications").insert({
          user_id: profile.id,
          type: "checkin",
          title: "We miss you 💚",
          body: `Hi ${firstName}, tap to check in — we're here whenever you need us.`,
          data: { kind: "self-checkin", inactive_hours: inactiveHours },
        });

        await admin.from("inactivity_alerts").insert({
          user_id: profile.id,
          contact_id: profile.id, // self-ping: contact_id = user_id
          contact_phone: "self",
          contact_name: firstName,
          inactive_hours: inactiveHours,
          channel: "self-push",
          status: notifErr ? "failed" : "sent",
          error: notifErr ? notifErr.message : null,
        });

        if (!notifErr) selfPushed++;
        continue;
      }

      // ─── TIER 2: 48h+ contact escalation ───
      // Respect user opt-out (Apple compliance / consent)
      if (profile.inactivity_alerts_enabled === false) {
        skipped.push(`${profile.id}:opted-out`);
        continue;
      }

      if (!termiiKey) {
        skipped.push(`${profile.id}:no-termii-key`);
        continue;
      }

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

      const { data: recent } = await admin
        .from("inactivity_alerts")
        .select("contact_id")
        .eq("user_id", profile.id)
        .eq("channel", "sms")
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
      `[inactivity-checkin] checked=${profiles.length} selfPushed=${selfPushed} dispatched=${dispatched} skipped=${skipped.length}`,
    );

    return new Response(
      JSON.stringify({
        checked: profiles.length,
        selfPushed,
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

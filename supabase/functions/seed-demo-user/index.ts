import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_EMAIL = "tendhermomtest@gmail.com";
const DEMO_PASSWORD = "USERTESTER1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find existing
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === DEMO_EMAIL);

    let userId: string;
    if (existing) {
      const { data: upd, error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { ...existing.user_metadata, full_name: "Tester", user_type: "mother" },
      });
      if (updErr) throw updErr;
      userId = upd.user!.id;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Tester", user_type: "mother" },
      });
      if (createErr) throw createErr;
      userId = created.user!.id;
    }

    // Ensure profile exists & is premium with a sensible LMP (~24w pregnant)
    const lmp = new Date(Date.now() - 24 * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const due = new Date(Date.now() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await admin.from("profiles").upsert({
      id: userId,
      full_name: "Tester",
      email: DEMO_EMAIL,
      phone: "+2348000000000",
      user_type: "mother",
      plan_type: "premium",
      lmp_date: lmp,
      due_date: due,
      current_stage: "second_trimester",
      can_post: true,
    }, { onConflict: "id" });

    return new Response(JSON.stringify({ success: true, user_id: userId, email: DEMO_EMAIL }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

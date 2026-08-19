// Initializes a Paystack subscription transaction for the signed-in user and
// returns the hosted checkout URL.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, json, PLANS, type PlanId, paystackFetch, secretKey } from "../_shared/paystack.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!secretKey()) return json({ error: "Payments are not configured yet." }, 503);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const planId = String(body?.plan_id ?? "") as PlanId;
  if (!["weekly", "monthly", "yearly"].includes(planId)) {
    return json({ error: "Choose a valid plan." }, 400);
  }
  const plan = PLANS[planId];

  const callbackUrl = typeof body?.callback_url === "string" ? body.callback_url : "";
  // Only allow our own origins as the return destination.
  const allowedHosts = ["tendhermomapps.lovable.app", "thmapps.lovable.app", "localhost"];
  let callback: string | undefined;
  try {
    const u = new URL(callbackUrl);
    if (allowedHosts.some((h) => u.hostname === h || u.hostname.endsWith(".lovable.app"))) {
      callback = u.toString();
    }
  } catch { /* ignore */ }

  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const email = profile?.email || user.email;
  if (!email) return json({ error: "Add an email to your profile before subscribing." }, 400);

  const reference = `thm_${planId}_${user.id.replace(/-/g, "").slice(0, 12)}_${Date.now()}`;

  const init = await paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: plan.amount,
      currency: "NGN",
      plan: plan.code,
      reference,
      callback_url: callback,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        full_name: profile?.full_name ?? "",
      },
    }),
  });

  if (!init.ok || !init.body?.data?.authorization_url) {
    console.error("[paystack-checkout] init failed", init.status, JSON.stringify(init.body));
    return json({ error: init.body?.message || "Could not start the payment." }, 502);
  }

  await admin.from("payment_transactions").insert({
    user_id: user.id,
    reference,
    plan_id: planId,
    plan_code: plan.code,
    amount: plan.amount,
    currency: "NGN",
    status: "pending",
  });

  return json({
    authorization_url: init.body.data.authorization_url,
    access_code: init.body.data.access_code,
    reference,
  });
});

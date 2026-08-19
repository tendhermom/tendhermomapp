// Verifies a Paystack transaction reference for the signed-in user and unlocks
// TendherMom Plus immediately (the webhook is the long-term source of truth).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  corsHeaders,
  json,
  PLANS,
  planByCode,
  paystackFetch,
  secretKey,
  expiryFor,
  type PlanId,
} from "../_shared/paystack.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Permanent testers are always premium.
  const { data: profile } = await admin
    .from("profiles")
    .select("is_tester, plan_type, plus_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_tester) {
    await admin
      .from("profiles")
      .update({ plan_type: "premium", plus_status: "tester", plus_expires_at: null })
      .eq("id", user.id);
    return json({ plan_type: "premium", expires_at: null, tester: true });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch { /* verify without a reference = status refresh */ }

  const reference = typeof body?.reference === "string" ? body.reference.trim() : "";

  if (!reference) {
    const active =
      profile?.plan_type === "premium" &&
      (!profile?.plus_expires_at || new Date(profile.plus_expires_at).getTime() > Date.now());
    return json({ plan_type: active ? "premium" : "free", expires_at: profile?.plus_expires_at ?? null });
  }

  if (!secretKey()) return json({ error: "Payments are not configured yet." }, 503);

  // The reference must belong to this user.
  const { data: txn } = await admin
    .from("payment_transactions")
    .select("id, user_id, plan_id")
    .eq("reference", reference)
    .maybeSingle();

  if (txn && txn.user_id !== user.id) return json({ error: "Unauthorized" }, 403);

  const res = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
  if (!res.ok) {
    console.error("[paystack-verify] failed", res.status, JSON.stringify(res.body));
    return json({ error: "Could not confirm the payment yet." }, 502);
  }

  const data = res.body?.data ?? {};
  const metaUserId = data?.metadata?.user_id;
  if (metaUserId && metaUserId !== user.id) return json({ error: "Unauthorized" }, 403);

  const success = String(data?.status ?? "").toLowerCase() === "success";
  const planId: PlanId =
    (txn?.plan_id as PlanId) ||
    (data?.metadata?.plan_id as PlanId) ||
    (planByCode(data?.plan_object?.plan_code)?.id ?? "monthly");
  const plan = PLANS[planId] ?? PLANS.monthly;

  await admin
    .from("payment_transactions")
    .update({
      status: success ? "success" : String(data?.status ?? "failed"),
      paid_at: success ? new Date(data?.paid_at ?? Date.now()).toISOString() : null,
    })
    .eq("reference", reference);

  if (!success) {
    return json({ plan_type: "free", expires_at: null, status: data?.status ?? "pending" });
  }

  const expiresAt = expiryFor(plan, new Date(data?.paid_at ?? Date.now()));

  const { error } = await admin
    .from("profiles")
    .update({
      plan_type: "premium",
      plus_provider: "paystack",
      plus_expires_at: expiresAt,
      plus_product_id: plan.code,
      plus_status: "active",
      plus_last_event: "verify",
      paystack_plan_code: plan.code,
      paystack_customer_code: data?.customer?.customer_code ?? null,
    })
    .eq("id", user.id);

  if (error) return json({ error: error.message }, 500);

  return json({ plan_type: "premium", expires_at: expiresAt });
});

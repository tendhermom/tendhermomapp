// Shared Paystack configuration + helpers for the TendherMom subscription flow.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export type PlanId = "weekly" | "monthly" | "yearly";

export interface PaystackPlan {
  id: PlanId;
  code: string;
  /** Amount in kobo. */
  amount: number;
  /** Days of access granted per billing cycle (plus a small grace buffer). */
  days: number;
}

/** Plan codes are whitelisted server-side — clients only send the plan id. */
export const PLANS: Record<PlanId, PaystackPlan> = {
  weekly: { id: "weekly", code: "PLN_bkz7wnoqgjs1p8v", amount: 30_000, days: 7 },
  monthly: { id: "monthly", code: "PLN_6c94708t6q0vcj5", amount: 100_000, days: 31 },
  yearly: { id: "yearly", code: "PLN_cycbstgc57j5o6f", amount: 1_000_000, days: 366 },
};

export const planByCode = (code?: string | null): PaystackPlan | null =>
  Object.values(PLANS).find((p) => p.code === code) ?? null;

export const secretKey = () => Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";

export async function paystackFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body } as {
    ok: boolean;
    status: number;
    body: any;
  };
}

/** Access expiry for a plan, with a 2-day grace buffer for retries. */
export const expiryFor = (plan: PaystackPlan, from: Date = new Date()): string =>
  new Date(from.getTime() + (plan.days + 2) * 24 * 60 * 60 * 1000).toISOString();

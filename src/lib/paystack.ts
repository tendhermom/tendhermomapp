/**
 * Paystack subscriptions for TendherMom Plus.
 *
 * Flow:
 *   1. `startCheckout(planId)` asks the backend to initialize a transaction and
 *      returns Paystack's hosted checkout URL.
 *   2. The browser / Despia webview navigates there; Paystack returns to
 *      `?screen=premium&reference=<ref>`.
 *   3. `consumeCheckoutReturn()` verifies the reference with the backend and
 *      unlocks Plus.
 */

import { supabase } from "@/integrations/supabase/client";

export const PAYSTACK_PUBLIC_KEY = "pk_live_284f0712a380a29b44f2651ea224e7f74ebf9030";

export type PlanId = "weekly" | "monthly" | "yearly";

export interface PlanDefinition {
  id: PlanId;
  label: string;
  price: string;
  period: string;
  tag: string | null;
  /** Paystack plan code (the backend re-validates this). */
  code: string;
}

export const PLANS: PlanDefinition[] = [
  { id: "weekly", label: "Weekly", price: "₦300", period: "/week", tag: null, code: "PLN_bkz7wnoqgjs1p8v" },
  { id: "monthly", label: "Monthly", price: "₦1,000", period: "/month", tag: "Popular", code: "PLN_6c94708t6q0vcj5" },
  { id: "yearly", label: "Yearly", price: "₦10,000", period: "/year", tag: "Save 36%", code: "PLN_cycbstgc57j5o6f" },
];

export const getPlan = (id: PlanId) => PLANS.find((p) => p.id === id) ?? PLANS[1];

const PENDING_KEY = "thm_paystack_pending_ref";

// ─── Checkout ─────────────────────────────────────────────────

export interface CheckoutResult {
  started: boolean;
  error?: string;
}

const callbackUrl = () => `${window.location.origin}/?screen=premium`;

export async function startCheckout(planId: PlanId): Promise<CheckoutResult> {
  try {
    const { data, error } = await supabase.functions.invoke("paystack-checkout", {
      body: { plan_id: planId, callback_url: callbackUrl() },
    });
    if (error) return { started: false, error: (data as any)?.error || error.message };
    const url = (data as any)?.authorization_url;
    const reference = (data as any)?.reference;
    if (!url) return { started: false, error: (data as any)?.error || "Could not start the payment." };

    try {
      if (reference) localStorage.setItem(PENDING_KEY, reference);
    } catch { /* private mode */ }

    window.location.href = url;
    return { started: true };
  } catch (e: any) {
    return { started: false, error: e?.message ?? "Could not reach the payment service." };
  }
}

// ─── Verification ─────────────────────────────────────────────

export interface VerifyResult {
  plan_type?: "free" | "premium";
  expires_at?: string | null;
  status?: string;
  error?: string;
}

export async function verifyPayment(reference?: string | null): Promise<VerifyResult> {
  try {
    const { data, error } = await supabase.functions.invoke("paystack-verify", {
      body: reference ? { reference } : {},
    });
    if (error) return { error: (data as any)?.error || error.message };
    return data as VerifyResult;
  } catch (e: any) {
    return { error: e?.message ?? "Could not confirm your subscription." };
  }
}

/** Reference returned by Paystack in the URL, or one stored before redirecting. */
export function pendingReference(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("reference") || params.get("trxref");
    if (fromUrl) return fromUrl;
    return localStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}

export function clearPendingReference() {
  try {
    localStorage.removeItem(PENDING_KEY);
    const url = new URL(window.location.href);
    if (url.searchParams.has("reference") || url.searchParams.has("trxref")) {
      url.searchParams.delete("reference");
      url.searchParams.delete("trxref");
      window.history.replaceState({}, "", url.toString());
    }
  } catch { /* ignore */ }
}

/**
 * Verify a payment we just came back from. Paystack can take a moment to settle,
 * so poll a few times before giving up.
 */
export async function confirmPremiumWithBackend(
  reference?: string | null,
  attempts = 4,
  delayMs = 1500,
): Promise<VerifyResult> {
  let last: VerifyResult = {};
  for (let i = 0; i < attempts; i++) {
    last = await verifyPayment(reference);
    if (last.plan_type === "premium") return last;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return last;
}

/** Handle a return from Paystack checkout, if there is one. */
export async function consumeCheckoutReturn(): Promise<VerifyResult | null> {
  const reference = pendingReference();
  if (!reference) return null;
  const result = await confirmPremiumWithBackend(reference);
  if (result.plan_type === "premium" || result.status === "failed") clearPendingReference();
  return result;
}

// ─── Manage ───────────────────────────────────────────────────

export interface SubscriptionStatus {
  plan_type?: "free" | "premium";
  status?: string | null;
  expires_at?: string | null;
  plan_code?: string | null;
  has_subscription?: boolean;
  tester?: boolean;
  error?: string;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const { data, error } = await supabase.functions.invoke("paystack-manage", {
      body: { action: "status" },
    });
    if (error) return { error: (data as any)?.error || error.message };
    return data as SubscriptionStatus;
  } catch (e: any) {
    return { error: e?.message ?? "Could not load your subscription." };
  }
}

export async function cancelSubscription(): Promise<{ cancelled: boolean; message?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("paystack-manage", {
      body: { action: "cancel" },
    });
    if (error) return { cancelled: false, error: (data as any)?.error || error.message };
    return { cancelled: Boolean((data as any)?.cancelled), message: (data as any)?.message };
  } catch (e: any) {
    return { cancelled: false, error: e?.message ?? "Could not cancel your subscription." };
  }
}

/** Human-friendly plan name from a stored plan code. */
export const planLabelForCode = (code?: string | null) =>
  PLANS.find((p) => p.code === code)?.label ?? "Plus";

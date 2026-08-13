/**
 * RevenueCat billing — Despia runtime integration (1:1 with the Despia docs)
 * https://setup.despia.com/payments/revenuecat/reference
 *
 * Schemes used:
 *   revenuecat://purchase?external_id=<userId>&product=<store product id>
 *   revenuecat://center?external_id=<userId>
 *   getpurchasehistory://            → { restoredData: [...] }
 *
 * Callbacks provided by the runtime:
 *   window.onRevenueCatPurchase()
 *   window.onRevenueCatCenter(event)
 *
 * `external_id` is always the signed-in Supabase user id, which is what the
 * RevenueCat webhook sends back as `app_user_id`.
 */

import { isDespiaNative } from "@/lib/despia";
import { supabase } from "@/integrations/supabase/client";

/** The RevenueCat entitlement that unlocks TendherMom Plus. */
export const PRO_ENTITLEMENT = "Pro";

export type PlanId = "weekly" | "monthly" | "yearly";

export interface PlanDefinition {
  id: PlanId;
  label: string;
  price: string;
  period: string;
  tag: string | null;
  /** App Store Connect product identifier. */
  ios: string;
  /** Google Play product identifier, in `subscriptionGroup:basePlan` form. */
  android: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: "weekly",
    label: "Weekly",
    price: "₦300",
    period: "/week",
    tag: null,
    ios: "tendhermom_weekly",
    android: "base:weekly",
  },
  {
    id: "monthly",
    label: "Monthly",
    price: "₦1,000",
    period: "/month",
    tag: "Popular",
    ios: "tendhermom_plus_monthly",
    android: "base:monthly",
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "₦10,000",
    period: "/year",
    tag: "Save 36%",
    ios: "tendhermom_plus_yearly",
    android: "base:yearly",
  },
];

export const getPlan = (id: PlanId) => PLANS.find((p) => p.id === id)!;

// ─── Runtime detection ────────────────────────────────────────

const ua = () => (typeof navigator === "undefined" ? "" : navigator.userAgent.toLowerCase());

export const isDespiaIOS = (): boolean =>
  isDespiaNative() && (ua().includes("iphone") || ua().includes("ipad"));

export const isDespiaAndroid = (): boolean => isDespiaNative() && ua().includes("android");

/** Purchases can only run inside the Despia shell. */
export const isBillingAvailable = (): boolean => isDespiaIOS() || isDespiaAndroid();

/** Resolve the correct store product id for the current platform. */
export const productIdFor = (plan: PlanDefinition): string =>
  isDespiaAndroid() ? plan.android : plan.ios;

const loadDespia = async () => (await import("despia-native")).default;

// ─── Purchase history / entitlement check ─────────────────────

export interface RestoredPurchase {
  transactionId?: string;
  originalTransactionId?: string;
  productId?: string;
  type?: string;
  entitlementId?: string;
  isActive?: boolean;
  willRenew?: boolean;
  purchaseDate?: string;
  expirationDate?: string | null;
  store?: string;
  environment?: string;
  externalUserId?: string;
}

/** Query the native store for every purchase on this device/account. */
export async function getPurchaseHistory(): Promise<RestoredPurchase[]> {
  if (!isBillingAvailable()) return [];
  try {
    const despia = await loadDespia();
    const data = await despia<{ restoredData?: RestoredPurchase[] }>("getpurchasehistory://", [
      "restoredData",
    ]);
    return data?.restoredData ?? [];
  } catch (e) {
    console.warn("[revenuecat] getpurchasehistory failed", e);
    return [];
  }
}

/**
 * Client-side entitlement hint. Fast and offline-capable, but NOT authoritative —
 * the backend (webhook + revenuecat-sync) remains the source of truth.
 */
export async function hasActiveProEntitlement(): Promise<boolean> {
  const purchases = await getPurchaseHistory();
  return purchases.some(
    (p) => p.isActive && String(p.entitlementId ?? "").toLowerCase() === PRO_ENTITLEMENT.toLowerCase(),
  );
}

// ─── Backend confirmation ─────────────────────────────────────

export interface SyncResult {
  plan_type?: "free" | "premium";
  expires_at?: string | null;
  error?: string;
}

/** Ask the backend to reconcile entitlements with RevenueCat and return the truth. */
export async function syncEntitlement(): Promise<SyncResult> {
  try {
    const { data, error } = await supabase.functions.invoke("revenuecat-sync", { body: {} });
    if (error) return { error: error.message };
    return { plan_type: data?.plan_type, expires_at: data?.expires_at ?? null };
  } catch (e: any) {
    return { error: e?.message ?? "Could not confirm your subscription." };
  }
}

/**
 * Poll the backend a few times after a purchase — the webhook can land a moment
 * after the store confirms client-side.
 */
export async function confirmPremiumWithBackend(attempts = 4, delayMs = 1500): Promise<SyncResult> {
  let last: SyncResult = {};
  for (let i = 0; i < attempts; i++) {
    last = await syncEntitlement();
    if (last.plan_type === "premium") return last;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return last;
}

// ─── Purchase / Customer Center ───────────────────────────────

export interface PurchaseOutcome {
  started: boolean;
  error?: string;
}

/** Trigger a native purchase for a plan. Resolves once the scheme is dispatched. */
export async function startPurchase(planId: PlanId, userId: string): Promise<PurchaseOutcome> {
  if (!userId) return { started: false, error: "You must be signed in to subscribe." };
  const plan = getPlan(planId);

  if (!isBillingAvailable()) {
    return {
      started: false,
      error: "Subscriptions are only available in the TendherMom mobile app.",
    };
  }

  try {
    const despia = await loadDespia();
    await despia(
      `revenuecat://purchase?external_id=${encodeURIComponent(userId)}&product=${encodeURIComponent(
        productIdFor(plan),
      )}`,
    );
    return { started: true };
  } catch (e: any) {
    return { started: false, error: e?.message ?? "Could not open the store." };
  }
}

/** Open the RevenueCat Customer Center (restore, manage, refunds). */
export async function openCustomerCenter(userId?: string | null): Promise<PurchaseOutcome> {
  if (!isBillingAvailable()) {
    return {
      started: false,
      error: "Subscription management is only available in the TendherMom mobile app.",
    };
  }
  try {
    const despia = await loadDespia();
    await despia(
      userId
        ? `revenuecat://center?external_id=${encodeURIComponent(userId)}`
        : `revenuecat://center`,
    );
    return { started: true };
  } catch (e: any) {
    return { started: false, error: e?.message ?? "Could not open subscription settings." };
  }
}

/** Restore purchases: re-query the store, then confirm with the backend. */
export async function restorePurchases(): Promise<{ premium: boolean; error?: string }> {
  if (!isBillingAvailable()) {
    return { premium: false, error: "Restore is only available in the TendherMom mobile app." };
  }
  const nativeActive = await hasActiveProEntitlement();
  const synced = await confirmPremiumWithBackend(nativeActive ? 4 : 1, 1200);
  if (synced.error && !nativeActive) return { premium: false, error: synced.error };
  return { premium: synced.plan_type === "premium" || nativeActive };
}

// ─── Runtime callbacks ────────────────────────────────────────

type EntitlementListener = () => void | Promise<void>;

const listeners = new Set<EntitlementListener>();

const notify = () => {
  listeners.forEach((fn) => {
    try {
      void fn();
    } catch (e) {
      console.warn("[revenuecat] listener failed", e);
    }
  });
};

/** Subscribe to purchase / Customer Center state changes. Returns an unsubscribe fn. */
export const onEntitlementChange = (fn: EntitlementListener): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

let handlersRegistered = false;

/** Register the Despia RevenueCat callbacks once, at app start. */
export function registerRevenueCatHandlers() {
  if (handlersRegistered || typeof window === "undefined") return;
  handlersRegistered = true;

  (window as any).onRevenueCatPurchase = async () => {
    notify();
  };

  (window as any).onRevenueCatCenter = (event: any) => {
    switch (event?.event) {
      case "restoreCompleted":
      case "refundCompleted":
      case "dismissed":
        notify();
        break;
      case "managementOptionSelected":
        if (event?.option === "customUrl" && event?.uri) {
          window.location.href = event.uri;
        }
        break;
      default:
        break;
    }
  };
}

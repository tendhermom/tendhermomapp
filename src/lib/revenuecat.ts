/**
 * RevenueCat (Apple App Store in-app purchases) — iOS only.
 *
 * Billing is split by platform:
 *   • iPhone / iPad (inside the Despia shell) → RevenueCat + App Store IAP.
 *     Apple requires StoreKit for digital subscriptions (Guideline 3.1.1), so
 *     the Paystack flow must never be shown on iOS.
 *   • Android + web → Paystack (src/lib/paystack.ts).
 *
 * Flow:
 *   1. The app opens the native App Store purchase sheet through the Despia
 *      runtime (`revenuecat://purchase` / `revenuecat://launchPaywall`).
 *   2. When the sheet closes, the app asks our backend (`revenuecat-sync`)
 *      to verify the entitlement server-side with RevenueCat's REST API and
 *      unlock Plus on the profile. The backend is authoritative — the client
 *      never trusts a callback alone.
 *   3. RevenueCat's webhook keeps the profile in sync afterwards
 *      (renewals, cancellations, refunds).
 */

import { supabase } from "@/integrations/supabase/client";
import { isDespiaNative } from "@/lib/despia";
import type { PlanId } from "@/lib/paystack";

// ─── Configuration ────────────────────────────────────────────
// Public (publishable) SDK key — safe to ship in the client.
export const REVENUECAT_PUBLIC_KEY = "appl_SdgfryQpMKqbYYAUhNcXqSzBcfB";

// RevenueCat offering + entitlement identifiers. Confirmed working values from the
// RevenueCat dashboard — update here if the user recreates them.
export const OFFERING_ID = "ofrng0ef46ad753";
export const ENTITLEMENT_ID = "entl269e323869";

// App Store product identifiers, one per plan.
export const IOS_PRODUCT_IDS: Record<PlanId, string> = {
  weekly: "tendhermom_weekly",
  monthly: "tendhermom_plus_monthly",
  yearly: "tendhermom_plus_yearly",
};

// ─── Platform detection ───────────────────────────────────────

/** True on Apple devices (iPhone/iPad), including iPadOS masquerading as Mac. */
export const isAppleDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return /Macintosh/i.test(ua) && (navigator as any).maxTouchPoints > 1;
};

/**
 * True when App Store billing (RevenueCat) should be used: a native Despia
 * shell on an Apple device. Android and the plain web use Paystack.
 */
export const isAppleBilling = (): boolean => isDespiaNative() && isAppleDevice();

// ─── Backend verification ─────────────────────────────────────

export interface RCVerifyResult {
  plan_type?: "free" | "premium";
  expires_at?: string | null;
  store?: string | null;
  product_id?: string | null;
  tester?: boolean;
  error?: string;
  cancelled?: boolean;
}

async function syncOnce(): Promise<RCVerifyResult> {
  try {
    const { data, error } = await supabase.functions.invoke("revenuecat-sync", {
      body: {},
    });
    if (error) return { error: (data as any)?.error || error.message };
    return data as RCVerifyResult;
  } catch (e: any) {
    return { error: e?.message ?? "Could not confirm your subscription." };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Ask the backend to check the entitlement with RevenueCat and unlock Plus.
 * Polls a few times — RevenueCat can take a moment to settle after a purchase.
 */
export async function verifyWithBackend(
  attempts = 6,
  delayMs = 2500,
): Promise<RCVerifyResult> {
  let last: RCVerifyResult = {};
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(delayMs);
    last = await syncOnce();
    if (last.plan_type === "premium") return last;
  }
  return last;
}

/** Restore purchases: the backend re-checks RevenueCat for this user. */
export async function restoreApplePurchase(
  attempts = 4,
): Promise<RCVerifyResult> {
  return verifyWithBackend(attempts);
}

/**
 * Client-side entitlement self-check via the native store. Queries the
 * Despia runtime (`getpurchasehistory://`) for active entitlements and, when
 * our entitlement is present, asks the backend to sync the profile. This
 * self-heals reinstalls or missed webhooks without a manual restore. The
 * backend stays authoritative — the client never unlocks Plus by itself.
 */
export async function syncIfNativeEntitlementActive(): Promise<boolean> {
  if (!isAppleBilling()) return false;
  try {
    const despia = await loadDespia();
    const data: any = await despia("getpurchasehistory://" as any, ["restoredData"]);
    const active: any[] = (data?.restoredData ?? []).filter((p: any) => p?.isActive);
    const ours = active.some(
      (p) => String(p.entitlementId ?? "").toLowerCase() === ENTITLEMENT_ID.toLowerCase(),
    );
    if (!ours) return false;
    const res = await syncOnce();
    return res.plan_type === "premium";
  } catch {
    /* the shell ignores unknown schemes on non-native builds */
    return false;
  }
}

// ─── Native purchase sheet ────────────────────────────────────

type PurchaseEvent = { status?: string; error?: string; product_id?: string } | null;

let callbacksRegistered = false;
let pendingPurchaseResolve: ((e: PurchaseEvent) => void) | null = null;

function registerNativeCallbacks() {
  if (callbacksRegistered || typeof window === "undefined") return;
  callbacksRegistered = true;
  (window as any).onRevenueCatPurchase = (event: any) => {
    const resolve = pendingPurchaseResolve;
    pendingPurchaseResolve = null;
    resolve?.(event ?? null);
  };
  // Customer Center events: when the user restores or changes anything inside
  // the native management sheet, re-check the entitlement so the web layer
  // reflects it immediately, then tell open screens to refresh.
  (window as any).onRevenueCatCenter = (event: any) => {
    const kind = typeof event === "string" ? event : (event?.event ?? event?.type);
    if (kind === "restoreCompleted" || kind === "dismissed") {
      void syncIfNativeEntitlementActive().finally(() => {
        try {
          window.dispatchEvent(new CustomEvent(PLUS_UPDATED_EVENT));
        } catch {
          /* non-DOM environment */
        }
      });
    }
  };
}

/** Fired on the window whenever the Apple entitlement state may have changed. */
export const PLUS_UPDATED_EVENT = "tendhermom:plus-updated";

/** Runs `open`, waits for the native purchase callback (or a timeout). */
async function waitForPurchaseEvent(
  open: () => void,
  timeoutMs = 180_000,
): Promise<PurchaseEvent> {
  registerNativeCallbacks();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<PurchaseEvent>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  const event = await Promise.race([timeout, new Promise<PurchaseEvent>((resolve) => {
    pendingPurchaseResolve = resolve;
    try {
      open();
    } catch (e) {
      pendingPurchaseResolve = null;
      resolve(null);
    }
  })]);
  if (timer) clearTimeout(timer);
  pendingPurchaseResolve = null;
  return event;
}

async function loadDespia() {
  const { default: despia } = await import("despia-native");
  return despia;
}

function wasCancelled(event: PurchaseEvent): boolean {
  const s = `${event?.status ?? ""} ${event?.error ?? ""}`.toLowerCase();
  return s.includes("cancel");
}

/**
 * Open the native App Store checkout. The native RevenueCat paywall lists all
 * three plans with the correct local App Store prices, which keeps the app
 * compliant with Apple's pricing display rules.
 */
export async function startApplePurchase(
  userId: string,
  planId?: PlanId,
): Promise<RCVerifyResult> {
  const despia = await loadDespia();

  const event = await waitForPurchaseEvent(() => {
    if (planId) {
      // Direct product purchase first — falls back to the full paywall below.
      const url = `revenuecat://purchase?external_id=${encodeURIComponent(userId)}&product=${IOS_PRODUCT_IDS[planId]}&offering=${OFFERING_ID}`;
      try {
        despia(url as any);
      } catch {
        /* fall through to the native paywall */
      }
      setTimeout(() => {
        despia(
          `revenuecat://launchPaywall?external_id=${encodeURIComponent(userId)}&offering=${OFFERING_ID}` as any,
        );
      }, 1500);
    } else {
      despia(
        `revenuecat://launchPaywall?external_id=${encodeURIComponent(userId)}&offering=${OFFERING_ID}` as any,
      );
    }
  });

  if (wasCancelled(event)) return { cancelled: true };
  return verifyWithBackend();
}

/** Open the RevenueCat management sheet (plan changes, cancellation). */
export async function openManageCenter(userId: string): Promise<void> {
  const despia = await loadDespia();
  registerNativeCallbacks();
  try {
    despia(`revenuecat://center?external_id=${encodeURIComponent(userId)}` as any);
  } catch {
    /* the shell ignores unsupported protocols */
  }
}

/**
 * RevenueCat Billing Bridge (via Despia native shell)
 *
 * Replaces the previous direct StoreKit / Play Billing bridge. RevenueCat is the
 * single source of truth for entitlements; the server reconciles them through
 * the `revenuecat-webhook` edge function, and the client can force a refresh
 * through `revenuecat-sync`.
 *
 * Despia protocol (callback based, identical shape to other Despia bridges):
 *   revenuecat://configure?appUserId=...&callback=cb
 *   revenuecat://offerings?callback=cb
 *   revenuecat://purchase?productId=...&callback=cb
 *   revenuecat://restore?callback=cb
 *   revenuecat://customerinfo?callback=cb
 *
 * The native shell invokes window[callback](jsonString) when complete.
 */

import { isDespiaNative } from "@/lib/despia";
import { supabase } from "@/integrations/supabase/client";

/** RevenueCat entitlement that unlocks TendherMom Plus. */
export const PLUS_ENTITLEMENT = "plus";

export type PlusProductId =
  | "tendhermom_plus_weekly"
  | "tendhermom_plus_monthly"
  | "tendhermom_plus_yearly";

export const PLUS_PRODUCT_IDS: PlusProductId[] = [
  "tendhermom_plus_weekly",
  "tendhermom_plus_monthly",
  "tendhermom_plus_yearly",
];

export interface StoreProduct {
  productId: PlusProductId;
  price: string; // localized, e.g. "₦2,500"
  priceAmount?: number;
  currencyCode?: string;
  title?: string;
}

export interface PurchaseResult {
  success: boolean;
  platform: "ios" | "android" | "unsupported";
  plan_type?: "free" | "premium";
  expires_at?: string;
  error?: string;
  cancelled?: boolean;
}

const detectPlatform = (): "ios" | "android" | "unsupported" => {
  if (typeof navigator === "undefined") return "unsupported";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "unsupported";
};

export const isBillingAvailable = (): boolean =>
  isDespiaNative() && detectPlatform() !== "unsupported";

/** Send a RevenueCat command to the Despia shell and await its callback. */
function rcCall<T>(action: string, params: Record<string, string> = {}, timeoutMs = 60_000): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!isDespiaNative()) {
      reject(new Error("Native bridge unavailable"));
      return;
    }
    const callbackName = `__despia_rc_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const timer = setTimeout(() => {
      delete (window as any)[callbackName];
      reject(new Error("Store request timed out"));
    }, timeoutMs);

    (window as any)[callbackName] = (raw: string) => {
      clearTimeout(timer);
      delete (window as any)[callbackName];
      try {
        resolve((typeof raw === "string" ? JSON.parse(raw) : raw) as T);
      } catch {
        reject(new Error("Invalid store response"));
      }
    };

    try {
      const qs = new URLSearchParams({ ...params, callback: callbackName }).toString();
      window.location.href = `revenuecat://${action}?${qs}`;
    } catch (e) {
      clearTimeout(timer);
      delete (window as any)[callbackName];
      reject(e);
    }
  });
}

/**
 * Identify the signed-in mum to RevenueCat so entitlements follow the account
 * across devices and reinstalls. Safe to call repeatedly.
 */
export async function configureForUser(userId?: string | null): Promise<void> {
  if (!isBillingAvailable()) return;
  try {
    const appUserId = userId ?? (await supabase.auth.getUser()).data.user?.id;
    if (!appUserId) return;
    await rcCall("configure", { appUserId }, 15_000);
  } catch (e) {
    console.warn("[revenuecat] configure failed", e);
  }
}

/** Localized store pricing for the Plus plans. Empty array on web. */
export async function fetchProducts(): Promise<StoreProduct[]> {
  if (!isBillingAvailable()) return [];
  try {
    const result = await rcCall<{ products?: StoreProduct[] }>(
      "offerings",
      { ids: PLUS_PRODUCT_IDS.join(",") },
      15_000,
    );
    return result.products ?? [];
  } catch (e) {
    console.warn("[revenuecat] fetchProducts failed", e);
    return [];
  }
}

/** Ask the backend to reconcile entitlements with RevenueCat. */
async function syncEntitlement(): Promise<{ plan_type?: "free" | "premium"; expires_at?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("revenuecat-sync", { body: {} });
    if (error) return { error: error.message };
    return { plan_type: data?.plan_type, expires_at: data?.expires_at };
  } catch (e: any) {
    return { error: e?.message ?? "Could not confirm your subscription." };
  }
}

/** Trigger a native purchase, then confirm the entitlement server-side. */
export async function purchase(productId: PlusProductId): Promise<PurchaseResult> {
  const platform = detectPlatform();

  if (!isBillingAvailable()) {
    return {
      success: false,
      platform,
      error: "Subscriptions are only available in the TendherMom mobile app.",
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, platform, error: "You must be signed in." };

  await configureForUser(user.id);

  let native: any;
  try {
    native = await rcCall("purchase", { productId, entitlement: PLUS_ENTITLEMENT });
  } catch (e: any) {
    return { success: false, platform, error: e?.message ?? "Purchase failed" };
  }

  if (native?.cancelled || native?.userCancelled) {
    return { success: false, platform, cancelled: true };
  }
  if (native?.error) {
    return { success: false, platform, error: String(native.error) };
  }

  const synced = await syncEntitlement();
  if (synced.error) {
    // The store charge succeeded; the webhook will reconcile shortly.
    return { success: true, platform, plan_type: "premium" };
  }
  return { success: true, platform, plan_type: synced.plan_type, expires_at: synced.expires_at };
}

/** Restore purchases (Apple + Google review requirement). */
export async function restorePurchases(): Promise<PurchaseResult> {
  const platform = detectPlatform();

  if (!isBillingAvailable()) {
    return {
      success: false,
      platform,
      error: "Restore is only available in the TendherMom mobile app.",
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, platform, error: "You must be signed in." };

  await configureForUser(user.id);

  try {
    await rcCall("restore", {}, 30_000);
  } catch (e: any) {
    return { success: false, platform, error: e?.message ?? "Restore failed" };
  }

  const synced = await syncEntitlement();
  if (synced.error) return { success: false, platform, error: synced.error };
  return {
    success: true,
    platform,
    plan_type: synced.plan_type,
    expires_at: synced.expires_at,
  };
}

/**
 * Native Billing Bridge — Apple StoreKit + Google Play Billing via Despia
 *
 * This module wraps Despia's native IAP protocol calls and routes the
 * resulting receipts/tokens to our edge functions for server-side verification.
 *
 * Despia's IAP bridge uses a callback-based protocol:
 *   iap://purchase?productId=...&callback=__despia_iap_cb_xyz
 *   iap://restore?callback=__despia_iap_cb_xyz
 *   iap://products?ids=...&callback=__despia_iap_cb_xyz
 *
 * The native shell invokes window[callback](resultJson) when complete.
 */

import { isDespiaNative } from "@/lib/despia";
import { supabase } from "@/integrations/supabase/client";

export type PlusProductId =
  | "tendhermom_plus_weekly"
  | "tendhermom_plus_monthly"
  | "tendhermom_plus_yearly";

export const PLUS_PRODUCT_IDS: PlusProductId[] = [
  "tendhermom_plus_weekly",
  "tendhermom_plus_monthly",
  "tendhermom_plus_yearly",
];

export interface NativeProduct {
  productId: PlusProductId;
  price: string; // localized e.g. "₦2,500"
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

export const isNativeBillingAvailable = (): boolean => {
  return isDespiaNative() && detectPlatform() !== "unsupported";
};

/** Send an IAP command to Despia and wait for its callback. */
function despiaIapCall<T>(action: string, params: Record<string, string>, timeoutMs = 60_000): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!isDespiaNative()) {
      reject(new Error("Native bridge unavailable"));
      return;
    }
    const callbackName = `__despia_iap_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const timer = setTimeout(() => {
      delete (window as any)[callbackName];
      reject(new Error("Native IAP timed out"));
    }, timeoutMs);

    (window as any)[callbackName] = (raw: string) => {
      clearTimeout(timer);
      delete (window as any)[callbackName];
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        resolve(parsed as T);
      } catch (e) {
        reject(new Error("Invalid native IAP response"));
      }
    };

    try {
      const url = `iap://${action}?${new URLSearchParams({ ...params, callback: callbackName }).toString()}`;
      window.location.href = url;
    } catch (e) {
      clearTimeout(timer);
      delete (window as any)[callbackName];
      reject(e);
    }
  });
}

/** Fetch product metadata (price, title) from the store. */
export async function fetchProducts(): Promise<NativeProduct[]> {
  if (!isNativeBillingAvailable()) return [];
  try {
    const result = await despiaIapCall<{ products: NativeProduct[] }>(
      "products",
      { ids: PLUS_PRODUCT_IDS.join(",") },
      15_000,
    );
    return result.products ?? [];
  } catch (e) {
    console.warn("[native-billing] fetchProducts failed", e);
    return [];
  }
}

/**
 * Trigger a native subscription purchase, then verify server-side.
 * On iOS the native shell returns { signedTransaction }.
 * On Android the native shell returns { purchaseToken }.
 */
export async function purchase(productId: PlusProductId): Promise<PurchaseResult> {
  const platform = detectPlatform();

  if (!isNativeBillingAvailable()) {
    return {
      success: false,
      platform,
      error: "Subscriptions are only available in the TendherMom mobile app.",
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, platform, error: "You must be signed in." };
  }

  let nativeResult: any;
  try {
    nativeResult = await despiaIapCall("purchase", { productId });
  } catch (e: any) {
    return { success: false, platform, error: e?.message ?? "Purchase failed" };
  }

  if (nativeResult?.cancelled) {
    return { success: false, platform, cancelled: true };
  }

  if (platform === "ios") {
    if (!nativeResult?.signedTransaction) {
      return { success: false, platform, error: "Missing transaction from App Store" };
    }
    const { data, error } = await supabase.functions.invoke("apple-iap-webhook", {
      body: {
        mode: "verify",
        signedTransaction: nativeResult.signedTransaction,
        userId: user.id,
      },
    });
    if (error) return { success: false, platform, error: error.message };
    return {
      success: true,
      platform,
      plan_type: data?.plan_type,
      expires_at: data?.expires_at,
    };
  }

  if (platform === "android") {
    if (!nativeResult?.purchaseToken) {
      return { success: false, platform, error: "Missing purchase token from Play" };
    }
    const { data, error } = await supabase.functions.invoke("google-iap-webhook", {
      body: {
        mode: "verify",
        purchaseToken: nativeResult.purchaseToken,
        productId,
        userId: user.id,
      },
    });
    if (error) return { success: false, platform, error: error.message };
    return {
      success: true,
      platform,
      plan_type: data?.plan_type,
      expires_at: data?.expires_at,
    };
  }

  return { success: false, platform, error: "Unsupported platform" };
}

/**
 * Restore previous purchases (Apple compliance requirement).
 * Triggers the native restore flow; the most recent active receipt is verified.
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  const platform = detectPlatform();

  if (!isNativeBillingAvailable()) {
    return {
      success: false,
      platform,
      error: "Restore is only available in the TendherMom mobile app.",
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, platform, error: "You must be signed in." };
  }

  let nativeResult: any;
  try {
    nativeResult = await despiaIapCall("restore", {}, 30_000);
  } catch (e: any) {
    return { success: false, platform, error: e?.message ?? "Restore failed" };
  }

  if (!nativeResult || nativeResult.empty) {
    return { success: false, platform, error: "No previous purchases found." };
  }

  if (platform === "ios" && nativeResult.signedTransaction) {
    const { data, error } = await supabase.functions.invoke("apple-iap-webhook", {
      body: {
        mode: "verify",
        signedTransaction: nativeResult.signedTransaction,
        userId: user.id,
      },
    });
    if (error) return { success: false, platform, error: error.message };
    return {
      success: true,
      platform,
      plan_type: data?.plan_type,
      expires_at: data?.expires_at,
    };
  }

  if (platform === "android" && nativeResult.purchaseToken && nativeResult.productId) {
    const { data, error } = await supabase.functions.invoke("google-iap-webhook", {
      body: {
        mode: "verify",
        purchaseToken: nativeResult.purchaseToken,
        productId: nativeResult.productId,
        userId: user.id,
      },
    });
    if (error) return { success: false, platform, error: error.message };
    return {
      success: true,
      platform,
      plan_type: data?.plan_type,
      expires_at: data?.expires_at,
    };
  }

  return { success: false, platform, error: "Nothing to restore." };
}

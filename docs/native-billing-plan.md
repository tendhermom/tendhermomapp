# TendherMom Plus — Native Billing Plan
**Apple StoreKit (iOS) + Google Play Billing (Android) via Despia**

> Stripe is intentionally **not** used for the Plus subscription. Apple and Google
> mandate their own in-app billing for digital subscriptions, and both pay out
> directly to a Nigerian bank account. This document is the runbook.

---

## 1. Plan & Pricing (source of truth)

These IDs must be **identical** across App Store Connect, Google Play Console, and the app code.

| Tier     | Price (NGN) | Product ID                       | Billing Period |
|----------|------------|----------------------------------|----------------|
| Weekly   | ₦700       | `tendhermom_plus_weekly`         | 1 week         |
| Monthly  | ₦2,500     | `tendhermom_plus_monthly`        | 1 month        |
| Yearly   | ₦25,000    | `tendhermom_plus_yearly`         | 1 year         |

Subscription Group (iOS): `tendhermom_plus`
Base Plan group (Android): `plus`

---

## 2. Apple — App Store Connect setup

### 2.1 Prerequisites
- Apple Developer Program membership (₦USD 99/yr) under your **legal entity**
- Signed **Paid Apps Agreement** in App Store Connect → Agreements, Tax & Banking
- Nigerian bank account added under **Banking** (Apple pays out in NGN)
- Tax forms (W-8BEN) completed

### 2.2 Create the subscription group
1. App Store Connect → My Apps → **TendherMom** → Monetization → **Subscriptions**
2. Create Subscription Group: `tendhermom_plus`
3. Add 3 subscriptions inside the group with the Product IDs from §1
4. For each: set price tier (NGN), localized display name, description
5. Provide a **review screenshot** (1290×2796) showing the paywall in-app
6. Add **Subscription Terms** + link to in-app Terms (`/terms`) and Privacy (`/privacy`)

### 2.3 Server notifications (for syncing plan_type)
- App Store Connect → App Information → **App Store Server Notifications V2**
- Production URL: `https://rnxarweuquyftywklsxa.supabase.co/functions/v1/apple-iap-webhook`
- Sandbox URL: same (we branch on `signedPayload.environment`)
- Save the **Issuer ID**, **Key ID**, and download the **.p8** for App Store Server API

### 2.4 Sandbox testers
- Users & Access → Sandbox → **Testers** → add 1–2 test Apple IDs (do not use your real one)

---

## 3. Google — Play Console setup

### 3.1 Prerequisites
- Google Play Developer account ($25 one-time) under your **legal entity**
- Merchant account linked (Payments profile) with Nigerian bank account
- Internal testing track created with the Despia-built APK/AAB uploaded at least once

### 3.2 Create the subscriptions
1. Play Console → TendherMom → **Monetize → Products → Subscriptions**
2. Create 3 subscriptions with the Product IDs from §1
3. Each gets one **Base Plan** (auto-renewing) inside group `plus`
4. Set NGN price per region; enable **grace period** (3 days) and **account hold** (7 days)
5. Activate each subscription

### 3.3 Real-time Developer Notifications (RTDN)
- Create a Pub/Sub topic in Google Cloud: `projects/<gcp-project>/topics/play-billing`
- Grant `google-play-developer-notifications@system.gserviceaccount.com` the `Pub/Sub Publisher` role
- Play Console → Monetization setup → **Real-time developer notifications** → paste topic name
- Push subscription endpoint: `https://rnxarweuquyftywklsxa.supabase.co/functions/v1/google-iap-webhook`

### 3.4 Service account (for verifying purchases)
- Google Cloud → IAM → Service Accounts → create `play-billing-verifier`
- Grant role: **Service Account User** + grant access in Play Console → Users & permissions
- Download the JSON key — store as Lovable secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

### 3.5 License testers
- Play Console → Setup → **License testing** → add tester emails for free purchases

---

## 4. Despia — native bridge

Despia exposes native StoreKit + Play Billing through a JS bridge. Confirm exact API names with Despia docs, but the integration shape is:

```ts
// src/lib/native-billing.ts (to be built)
import { despia } from "@/lib/despia";

export type PlusProductId =
  | "tendhermom_plus_weekly"
  | "tendhermom_plus_monthly"
  | "tendhermom_plus_yearly";

export async function fetchProducts() {
  return despia.iap.getProducts([
    "tendhermom_plus_weekly",
    "tendhermom_plus_monthly",
    "tendhermom_plus_yearly",
  ]);
}

export async function purchase(productId: PlusProductId) {
  // Returns { receipt, platform: "ios" | "android", purchaseToken? }
  return despia.iap.purchase(productId);
}

export async function restorePurchases() {
  return despia.iap.restore();
}
```

After a successful purchase, send the receipt/token to our edge function for **server-side verification** (never trust client).

---

## 5. Backend — verification edge functions

Two new edge functions to build:

### `apple-iap-webhook` + `verify-apple-receipt`
- Verifies the JWS receipt with Apple's App Store Server API
- On valid `SUBSCRIBED` / `DID_RENEW` / `EXPIRED` / `REVOKE` → updates `profiles.plan_type`
- On `REFUND` → downgrades to `free`

### `google-iap-webhook` + `verify-google-purchase`
- Verifies `purchaseToken` via `androidpublisher.purchases.subscriptionsv2.get`
- Maps RTDN `subscriptionNotification.notificationType` → plan changes
- Updates `profiles.plan_type` and `profiles.plus_expires_at`

### New DB columns (migration to run when we start coding)
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plus_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS plus_provider text,        -- 'apple' | 'google'
  ADD COLUMN IF NOT EXISTS plus_product_id text,
  ADD COLUMN IF NOT EXISTS plus_original_tx_id text;  -- Apple originalTransactionId / Google purchaseToken
```

---

## 6. App-side UX changes (PremiumScreen)

Replace any future Stripe checkout with platform-aware buttons:

```tsx
// PremiumScreen.tsx (sketch — to be built)
const products = await fetchProducts();

<button onClick={() => purchase("tendhermom_plus_monthly")}>
  Subscribe — ₦2,500/month
</button>

// iOS App Store legal requirements:
<p>Auto-renewable. Cancel anytime in Settings → Apple ID → Subscriptions.</p>
<a href="/terms">Terms</a> · <a href="/privacy">Privacy</a>
<button onClick={restorePurchases}>Restore Purchases</button>
```

> Apple **rejects** apps without a visible `Restore Purchases` button and the legal disclosure above.

---

## 7. Compliance gotchas (will cause rejection)

- ❌ Don't mention Stripe, card payments, or external payment URLs anywhere in the iOS build's paywall copy
- ❌ Don't reference web prices that differ from in-app prices
- ✅ Show subscription length, price, and auto-renewal terms on the paywall **before** purchase
- ✅ Provide working **Restore Purchases**
- ✅ Link to Privacy + Terms from the paywall
- ✅ Account deletion must also cancel/refund guidance (already implemented for Apple compliance)

---

## 8. Rollout order

1. ✅ This planning doc (you are here)
2. Apple Dev + Play Console accounts ready, banking + tax forms approved
3. Create subscriptions in both consoles (§2.2 + §3.2)
4. Migration: add `plus_expires_at` etc. columns to `profiles`
5. Build `apple-iap-webhook` + `google-iap-webhook` edge functions + secrets
6. Build `src/lib/native-billing.ts` Despia bridge
7. Wire `PremiumScreen` to native purchase flow + Restore button
8. Sandbox test on a real iOS device (TestFlight) and Android internal track
9. Submit for review with screenshots of paywall + subscription terms

---

## 9. What you need to do *now* (no code yet)

- [ ] Confirm Apple Developer account is active and Paid Apps Agreement signed
- [ ] Confirm Google Play Developer account is active with Merchant profile
- [ ] Add Nigerian bank account in both consoles
- [ ] Decide if the legal entity is your name or a registered business (affects tax forms)
- [ ] Reply with a screenshot of the **Subscriptions** screen in App Store Connect once you've created the 3 product IDs

Once those are done, ping me and we proceed to step 4 onward (DB migration + edge functions + Despia bridge).

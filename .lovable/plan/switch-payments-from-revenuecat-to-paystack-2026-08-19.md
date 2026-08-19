# Switch payments from RevenueCat to Paystack

Remove every RevenueCat piece and replace it with Paystack subscriptions using your three
plan codes, so mums can subscribe from the app (and from the web) with card, bank transfer,
USSD or Opay — no App Store / Play Store dependency.

## Plans

| Plan | Price | Paystack plan code |
| --- | --- | --- |
| Weekly | ₦300 | PLN_bkz7wnoqgjs1p8v |
| Monthly | ₦1,000 | PLN_6c94708t6q0vcj5 |
| Yearly | ₦10,000 | PLN_cycbstgc57j5o6f |

## What gets built

**1. Subscription plan page (`/premium`)**
Rebuilt premium screen in the existing premium visual style: three selectable plan cards
(Yearly pre-selected with "Save 36%", Monthly "Popular", Weekly), the Plus benefit list,
one primary CTA, and a "Manage subscription" / "I already paid — refresh" pair. The same
plan selector powers the existing paywall drawer used by Rescue Map, Safety Net, AI Chat,
Baby Shower and the profile upsell.

**2. Checkout flow**
- Tapping Subscribe calls a new backend function that initializes a Paystack transaction
  for the chosen plan code, tied to the signed-in user's email and ID.
- The app opens Paystack's hosted checkout page (works in the Despia webview, mobile
  browser and desktop) and returns to the app afterwards.
- On return the app verifies the transaction with the backend and unlocks Plus instantly.
- No more "only available in the mobile app" blocking message — web works too.

**3. Backend entitlement**
- `paystack-checkout` — initializes the subscription transaction (validated input, auth
  required, plan code whitelisted server-side so a client cannot pass an arbitrary plan).
- `paystack-verify` — verifies a reference and updates the profile.
- `paystack-webhook` — signature-verified with the Paystack secret key; handles
  `charge.success`, `subscription.create`, `invoice.payment_failed`,
  `subscription.not_renew` and `subscription.disable`, setting plan, status and expiry.
- Existing profile columns are reused: `plan_type`, `plus_provider` (now `paystack`),
  `plus_expires_at`, `plus_product_id`, `plus_status`, `plus_last_event`. A small migration
  adds the Paystack customer/subscription reference columns needed to cancel later.
- `is_tester` keeps working: `tendhermomtest@gmail.com` stays premium regardless.

**4. Manage / cancel**
"Manage subscription" shows current plan, renewal date and a Cancel action that calls
Paystack's disable-subscription endpoint; access stays until the paid period ends.

**5. RevenueCat removal**
Delete `src/lib/revenuecat.ts`, the `revenuecat-webhook` and `revenuecat-sync` functions,
their `config.toml` entry, the `registerRevenueCatHandlers()` call in `main.tsx`, all
Despia `revenuecat://` schemes, restore-purchases UI, and the now-unused RevenueCat
secrets. Nothing else in the app changes.

## Technical notes

- The Paystack **live secret key** must live in a backend secret. `STRIPE_LIVE_API_KEY` is a
  Stripe-named slot, so I will request a new `PAYSTACK_SECRET_KEY` secret and you paste the
  live key into it (never in client code). The public key
  `pk_live_284f0712a380a29b44f2651ea224e7f74ebf9030` is publishable and can sit in the app.
- Webhook URL to register in your Paystack dashboard (I will give you the exact URL after
  deploy) — it runs without JWT verification and validates the `x-paystack-signature`
  HMAC-SHA512 of the raw body.
- Callback URL returns to the app with the transaction reference so verification is
  immediate rather than waiting on the webhook.
- Currency stays NGN, matching the plans already created in Paystack.

## Out of scope

Refunds and dunning emails are handled from your Paystack dashboard.

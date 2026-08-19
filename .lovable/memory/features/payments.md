---
name: Payments (Paystack)
description: Paystack subscriptions replace RevenueCat — plan codes, checkout flow, webhook and entitlement rules
type: feature
---

Payments run on **Paystack** (live). RevenueCat/App Store/Play billing is fully removed — never re-add it.

Plans (NGN, plan codes whitelisted server-side in `supabase/functions/_shared/paystack.ts`):
- Weekly ₦300 — `PLN_bkz7wnoqgjs1p8v`
- Monthly ₦1,000 — `PLN_6c94708t6q0vcj5`
- Yearly ₦10,000 — `PLN_cycbstgc57j5o6f`

Flow: `paystack-checkout` (initialize, returns hosted checkout URL) → redirect →
return to `/?screen=premium&reference=...` → `paystack-verify` unlocks Plus →
`paystack-webhook` (HMAC-SHA512 `x-paystack-signature`, verify_jwt=false) keeps it in sync →
`paystack-manage` for status and cancel (access lasts until the paid period ends).

Entitlement: `is_tester` OR (`plan_type = 'premium'` AND `plus_expires_at` in the future/null).
Secret: `PAYSTACK_SECRET_KEY`. Public key `pk_live_284f0712a380a29b44f2651ea224e7f74ebf9030` lives in `src/lib/paystack.ts`.

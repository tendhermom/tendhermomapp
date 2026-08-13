# RevenueCat Subscriptions via Despia + Vaul Paywall

Replace the current custom `revenuecat://` callback bridge with the official Despia
RevenueCat scheme set, add a modern Vaul drawer paywall, and make premium access
entitlement-driven again (currently every profile is force-unlocked for testing).

## Plans and IDs

| Plan | Entitlement | App Store product | Google Play product |
| --- | --- | --- | --- |
| Weekly | Pro | `tendhermom_weekly` | `base:weekly` |
| Monthly | Pro | `tendhermom_plus_monthly` | `base:monthly` |
| Yearly | Pro | `tendhermom_plus_yearly` | `base:yearly` |

The app picks the App Store ID on Despia iOS and the Play ID on Despia Android.

## What gets built

**1. Despia RevenueCat bridge (rewrite of `src/lib/revenuecat.ts`)**
Uses the `despia-native` SDK (already installed) exactly as documented:
- `revenuecat://purchase?external_id=<userId>&product=<platform product id>` for each plan
- `revenuecat://center?external_id=<userId>` for the Customer Center (restore, manage, refund)
- `getpurchasehistory://` with `['restoredData']` for client-side entitlement checks
- `window.onRevenueCatPurchase` and `window.onRevenueCatCenter` handlers registered once at app start
- `external_id` is always the signed-in Supabase user ID
- Non-Despia browsers: purchase buttons show a clear "available in the mobile app" state

**2. Vaul drawer paywall (`src/components/PaywallDrawer.tsx`)**
A bottom drawer built with Vaul (already a dependency, used by the shadcn Drawer):
- Rounded top sheet, drag handle, safe-area bottom padding, 390px content width
- Three selectable plan rows (Yearly pre-selected with "Save 36%", Monthly "Popular", Weekly)
- Benefit list, single primary CTA, "Restore purchases" and "Manage subscription" links
- Legal links (Terms / Privacy), forest green + coral tokens, spring press feedback
- Opens from `PremiumGate` and from the Plus entry points in Profile/Premium screen;
  `PremiumScreen` keeps its full comparison page and reuses the same purchase logic

**3. Backend entitlement logic**
- Rework `revenuecat-webhook` to the documented event mapping: `INITIAL_PURCHASE`,
  `RENEWAL`, `UNCANCELLATION`, `SUBSCRIPTION_EXTENDED`, `PRODUCT_CHANGE`, `TRANSFER`
  → active; `CANCELLATION` → active until expiry; `EXPIRATION`, `REFUND` → revoked;
  `BILLING_ISSUE` → grace-period aware. Only the `Pro` entitlement is honoured.
- Resolve the user from `app_user_id` (falling back to `original_app_user_id`) and write
  `plan_type`, `plus_provider`, `plus_expires_at`, plus new columns for store, product ID,
  subscription status and last event, so support can see why access is on or off.
- Sandbox events are only applied for flagged testers.
- Keep `revenuecat-sync` as the post-purchase confirmation call, updated to read the
  `Pro` entitlement.

**4. Test account**
`tendhermomtest@gmail.com` is marked as a permanent tester in the database
(`is_tester` flag on the profile) and always resolves to premium, independent of
RevenueCat. Everyone else must hold an active `Pro` entitlement.

**5. Remove the blanket unlock**
`src/stores/authStore.ts` currently hardcodes `plan_type: "premium"` for every user.
This reverts to the real value from the profile, so gating works again for new users.

## Technical notes

- New migration: `profiles.is_tester boolean default false`, plus
  `plus_store`, `plus_product_id`, `plus_status`, `plus_last_event` columns; GRANTs
  unchanged from the existing profiles policy set; tester flag set for the test email.
- Premium resolution becomes: `is_tester` OR (`plan_type = 'premium'` AND
  `plus_expires_at` in the future or null).
- `REVENUECAT_WEBHOOK_SECRET` and `REVENUECAT_SECRET_KEY` are already configured;
  the webhook stays `verify_jwt = false`.
- Client-side `getpurchasehistory://` result is used only as an optimistic unlock hint;
  the backend value remains authoritative, per the Despia warning.

## Out of scope

RevenueCat dashboard setup (creating the `Pro` entitlement, attaching the six store
products, pointing the webhook at the edge function) is done by you in the dashboard —
I will list the exact values to enter once the code is in.

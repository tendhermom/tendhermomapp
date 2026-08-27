# Back-navigation ladder, real app exit, and Paystack unlock fixes

## 1. Step-by-step back flow inside the app

Today every secondary screen sits in a single navigation stack, but screens with internal steps (Rescue Map especially) hide those steps from the back system. From a map result list, one back jumps all the way out of that step level instead of walking back one step at a time.

Change: give screens a way to own the back press.

- Add a small back-handler registry in `src/pages/Index.tsx`: screens register a function that returns `true` if they consumed the back press.
- Rescue Map (`HealthHubsScreen`) registers a handler with three levels, so back walks:
  `map results → services list of the chosen category → categories grid → Home`.
  Its on-screen Back button uses the exact same handler, so the in-app arrow and the phone button behave identically.
- The same registry is reused by Triage and any other screen with internal steps, so a back press always undoes exactly the last thing the user did.
- The visible Back control in each step keeps its current premium styling; only what it does changes.

## 2. Phone back button → Exit prompt → app actually closes

The Exit prompt already appears at the root level. The problem is the confirm action only rewinds browser history, which a native shell ignores.

Change in `Index.tsx` / `src/lib/despia.ts`:

- Add a `closeApp()` helper that asks the native shell to finish the app (Despia native close command), and falls back to unwinding history + `window.close()` in the browser.
- On confirm: disarm the back guard, clear the saved navigation stack so a relaunch starts clean, then call `closeApp()`.
- Android will close fully. iOS does not permit an app to close itself, so there we dismiss the prompt and leave the app at the root (unchanged system behaviour) rather than looking stuck.

## 3. Paystack: paid but Plus not unlocked, and no way to stop renewal

Verified against live data: a successful weekly payment on 22 Aug was recorded as `success` in the transactions table, but that user's profile still shows no Plus, no expiry, and no subscription code — so the unlock step never landed and there was nothing for the cancel button to attach to.

Three concrete fixes:

- **"I already paid" must actually re-check Paystack.** It currently sends no payment reference, so the backend just re-reads the profile that was never updated — hence "no active subscription". It will instead re-verify the user's recent payment references directly with Paystack, and, if none match, look the customer up by their account email and grant Plus from any successful charge or active subscription found.
- **Unlock is made resilient.** The verify step will retry the profile update and record the outcome, and the return-from-checkout flow will retry in the background even if the user lands on Home instead of the subscription screen. A backfill will also repair the already-affected paid account so it gets the Plus time it paid for.
- **Stop recurring debit is made visible and usable.** The cancel row only appeared when a subscription code was stored, which never happened. The subscription screen will always show a clear "Manage / stop renewal" action for paying members; the backend resolves the subscription from Paystack by customer email when the code is missing, saves it, disables renewal, and confirms that access continues until the paid period ends.

## Technical notes

- `src/pages/Index.tsx`: back-handler registry (`registerBackHandler`) passed to screens; `confirmExit` clears `tendher_nav_v1` and calls the new close helper.
- `src/lib/despia.ts`: `closeApp()` native command with browser fallback.
- `src/screens/HealthHubsScreen.tsx`: single `goBackOneStep()` used by both the header arrow and the registered handler.
- `supabase/functions/paystack-verify/index.ts`: when no reference is supplied, re-verify recent `payment_transactions` rows for the user, then fall back to Paystack customer lookup (`/customer/:email`, `/subscription?customer=`) before answering.
- `supabase/functions/paystack-manage/index.ts`: resolve and persist `paystack_subscription_code` / `email_token` from Paystack when missing, before disabling.
- `src/lib/paystack.ts` / `PremiumScreen.tsx`: restore passes the stored pending reference; manage section always rendered for premium members.
- One-off data repair for the affected paid account.

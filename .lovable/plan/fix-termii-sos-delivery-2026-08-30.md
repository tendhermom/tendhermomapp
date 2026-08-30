# Fix Termii SOS delivery

## What the evidence shows

Checked the last 10 SOS alerts in the database. Every one of them recorded `sms: sent` — meaning Termii's API **accepted** the request and returned a success response each time (28 Aug, 29 Aug included). Numbers are already normalised to `234...` before sending, so the format issue Termii mentioned is not present in our code.

So the problem is not "the app never calls Termii" and not the number format. Either Termii accepted-then-dropped the message (sender ID pending, route not enabled on the account, or carrier rejection), or our success check is too loose and we are treating a soft rejection as a send. We cannot tell which yet, because we never store Termii's `message_id` or check the delivery status afterwards.

One extra finding: each SOS writes **two** rows into the alert history — one from the server with real results, one from the app with an empty result. That double-logging is cosmetic but should be cleaned up.

## Plan

### 1. Stop guessing — record what Termii actually says
- Store Termii's `message_id`, the sender ID used, the route used, and the raw response for every message in the alert log.
- Tighten the success check: only count a message as sent when Termii returns a `message_id`. Anything else is a failure with the real reason.

### 2. Sender-ID and route fallback ladder
Termii rejects/drops messages sent from an unapproved sender ID. While `TendherMom` is pending approval, try in order until one is accepted:
1. `TendherMom` on the transactional (dnd) route
2. `N-Alert` (Termii's pre-approved transactional sender, bypasses DND) on the dnd route
3. `N-Alert` on the generic route

Record which combination succeeded so we can see in the logs which one actually works, and switch the default to it.

### 3. Delivery-status check
Add an admin-only diagnostics function that reports, on demand:
- wallet balance / SMS credits
- registered sender IDs and their approval status
- delivery status of the most recent SOS message IDs

This turns "can't send emergency message" into a precise answer (insufficient balance / sender rejected / route not enabled / delivered).

### 4. Clean up double logging
Remove the client-side duplicate insert into the alert history; the server row already has the full per-channel result.

### 5. Verify end to end
Run a real test alert to your own number with the fallback ladder in place, then read the delivery status back from Termii and report exactly what happened. If Termii reports insufficient balance or an account-level route block, that is an account action on your side and I will say so plainly rather than claim it works.

## Technical notes
- Files touched: `supabase/functions/send-sos/index.ts`, a new `supabase/functions/termii-status/index.ts` (admin-only), `src/screens/SOSScreen.tsx` (remove duplicate insert, surface the detailed failure reason).
- No database schema change needed; the existing `channel_success` JSON column carries the richer per-message detail.
- No changes to rate limits, contact caps, UI layout, or any other feature.

# Final 3 issues before publish

## 1. SOS contact picker shows only half on screen

**Cause (confirmed):** The contact-picker sheet in `EmergencyContactsScreen.tsx` (line 667) centers itself with `left-1/2 -translate-x-1/2` while Framer Motion animates its `y` position. Framer Motion rewrites the whole `transform` style during the slide-up animation, which erases the `-translate-x-1/2` centering — so the sheet's left edge lands at the middle of the screen and half of it sits off-screen to the right.

**Fix:** Replace translate-centering with `left-0 right-0 mx-auto max-w-[430px]` (the same centering pattern the other sheets use), which animation cannot break. Verified this is the only sheet in the app using the broken pattern. The result: the picker slides up centered, full width, with the contact list fully visible and tappable.

## 2. Exit button doesn't leave the app

**Cause (confirmed):** The exit guard in `Index.tsx` keeps exactly one "sentinel" history entry so a hardware back press shows the "Leave TendherMom?" sheet instead of dropping out. When you tap **Exit**, it calls `history.go(-2)` — but only one entry exists behind the current one, so the browser clamps back to the root page, the guard immediately re-arms, and the app stays open (the prompt can even reappear). The button effectively cancels itself.

**Fix:**
- On Exit, disarm the guard first (stop re-seeding the sentinel), then unwind every history entry we created so the WebView's history is empty, and attempt `window.close()`.
- On Android/Despia, once the WebView history is exhausted the native shell finishes the app on the next back press — with the guard disarmed, one press exits cleanly instead of looping the prompt.
- Note: iOS does not allow any app to close itself programmatically (Apple platform rule — true for every app, not just ours). On iOS the Exit tap will dismiss cleanly to a clean root state; mums close the app with the normal swipe-up gesture. No fake "closing" screens added.

## 3. Termii SOS fails with "Can't send emergency message"

**Cause (confirmed against Termii docs):** Termii's `sms/send` API requires the destination number in international format **without** a `+` (example from their docs: `23490126727`). Emergency contacts are stored as `+234...` and sent verbatim, so Termii rejects the request, every channel reports failed, and the function returns an error. A second likely contributor: the `TendherMom` sender ID must be registered and approved ("unblock" status) on the Termii dashboard — unregistered sender IDs are rejected.

**Fix in the `send-sos` function:**
- Normalize every phone number before sending: strip all non-digits, convert a leading `0` to `234` (Nigerian local format), so `+234 801...`, `0801...`, and `234801...` all become `234801...`.
- Channel fallback: if the `dnd` route rejects a message, automatically retry that contact once on the `generic` route before marking it failed.
- Real error reporting: include Termii's actual rejection reason in the response, and show that detail in the SOS screen's error toast instead of a generic message — so the next failure tells us exactly why.
- The function already logs every attempt and never counts a contact as notified unless Termii confirms acceptance; that stays.

**One action on your side (can't be done in code):** in the Termii dashboard, confirm the sender ID `TendherMom` is registered and shows status "unblock", and that the DND route is enabled on the account. I'll add a verification step that checks this via Termii's sender-id API and reports the result before we publish.

## Technical notes
- Files touched: `src/screens/EmergencyContactsScreen.tsx`, `src/pages/Index.tsx`, `supabase/functions/send-sos/index.ts`, `src/screens/SOSScreen.tsx` (error toast only).
- No database, payment, or navigation-structure changes. Rate limits, contact caps, and the test-alert flow are untouched.
- Verified against Termii's official messaging and sender-id API docs; verified Despia exposes no app-exit command in its SDK/docs (full scheme list checked), so the exit fix works within what the WebView allows.
- After the fixes: rebuild, verify the picker centers at the 390px viewport, exercise the exit prompt, and run a safe non-delivery SOS test to confirm the Termii normalization works end to end.

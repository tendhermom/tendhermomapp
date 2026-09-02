# Termii-approved SOS message + Emergency Phone capture

## What's in place today

- SOS goes out through the `send-sos` function using Termii, with numbers normalised to `234...`, a sender/route ladder, and a per-contact delivery report in the app.
- The current SMS text is a long multi-line "EMERGENCY ALERT — TendherMom" message — not the format Termii approved.
- Onboarding asks only for the **emergency contact's** phone. It never asks the mum for her own number, and signup no longer collects one, so most accounts have no phone saved. The SOS message therefore cannot reliably include "Call 2348012345678".

## Changes

### 1. Adopt the approved SMS format

New single-line message, built server-side:

```text
SOS: Amina, 32 weeks pregnant needs urgent help at Unguwan Rimi, Kaduna. Call 2348012345678. Map: https://maps.google.com/?q=9.05,7.49. Pls respond. Powered by TendherMom
```

Rules for each part:
- **Name** — the mum's first name from her profile.
- **Stage** — "32 weeks pregnant" computed from her LMP/due date; if she is postpartum it reads "recently delivered", and if no date is set the phrase is dropped.
- **Place** — reverse-geocoded from the live GPS fix (neighbourhood + city) using the Google Maps key already stored in the backend. If geocoding fails or GPS is off, the "at <place>" part is dropped rather than showing coordinates.
- **Call <number>** — her Emergency Phone (see step 2), in `234...` form. Omitted if she has none.
- **Map** — Google Maps link to the live coordinates. Omitted if no fix.
- Always ends with "Pls respond. Powered by TendherMom".
- Test alerts keep a short "[TEST] " prefix.

Every piece is optional-safe, so the message stays valid and under one/two SMS pages in every case.

### 2. "Emergency Phone" in onboarding

- Add her own number to the onboarding contact step, labelled **Emergency Phone** with helper text explaining responders will be asked to call this number. Saved to her profile.
- The existing emergency-contact field is relabelled clearly as the contact's number, so the two are never confused.
- Validated and stored in the `234...` format with the same Nigerian number rules the SOS screen already uses.
- Existing users who never gave a number: a one-time prompt on the SOS screen ("Add your Emergency Phone so responders know who to call") linking to Edit Profile, and the Edit Profile field is renamed to Emergency Phone.

### 3. Verify Termii end to end

- Re-check account state (balance, sender ID `TendherMom`, whether the DND/transactional route is now enabled after activation) and set the send ladder to whichever route the activated account supports, transactional first.
- Send one real test alert to a number you nominate, then read Termii's delivery status for that message id and report exactly what came back — sender shown, route, delivered/rejected.

## Technical notes

- Files: `supabase/functions/send-sos/index.ts` (message builder, reverse geocode, route ladder), `supabase/functions/termii-status/index.ts` (route/sender readout), `src/screens/OnboardingScreen.tsx`, `src/screens/EditProfileScreen.tsx`, `src/screens/SOSScreen.tsx` (send her profile phone + weeks, missing-number prompt).
- No database change needed — `profiles.phone` already exists.
- Reverse geocoding runs in the edge function with the existing Google Maps key, with a 3s timeout so it can never delay a life-safety message.
- No changes to rate limits, contact caps, gifting, payments, or any other feature.

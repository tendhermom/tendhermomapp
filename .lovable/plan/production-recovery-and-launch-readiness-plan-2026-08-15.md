# Production recovery and launch-readiness plan

## Goal
Replace the stale published frontend with one verified release, fix the reported functional/UI regressions, and validate each critical flow before publishing again.

## Confirmed diagnosis
- The live site is serving build `msre445k-7nrtux`, while the current source now generates a different build ID. The live bundle still contains **“Share TendherMom”** and the old exit dialog, proving it is not the current source.
- Health Tracker currently averages up to five readings in Smart Guidance instead of using the newest reading.
- Rescue Map requests reach the backend, but Google rejects them because billing is disabled on the Google Cloud project. This external account setting cannot be fixed in app code.
- SOS requests reach the backend, but recent Termii calls failed with connection errors/HTTP 422; the backend needs a corrected, validated Termii request and clearer delivery reporting.
- The published payment bundle contains the “mobile app only” message but no RevenueCat native command marker, so the shipped payment code must be replaced by the verified current implementation.

## Implementation

### 1. Restore the intended UI and interactions
- Force **Rescue Map** onto two lines in Home Quick Access.
- Remove **Share TendherMom** from Profile.
- Increase Baby Shower locked-state contrast using the existing forest-green premium treatment.
- Show community photos without destructive cropping and add a full-screen image viewer on tap.
- Replace the non-functional community share/save icon with a working bookmark action and clear saved state.

### 2. Repair Community posting and comments
- Keep the comment composer above both the app tab bar and native keyboard using safe-area/visual-viewport positioning.
- Make comment submission visibly available, validate failures, and refresh counts/comments only after a successful write.
- Surface post/comment database errors instead of silently displaying an empty state.
- Load public names and avatars reliably, invalidate stale “Anonymous” profile cache entries, and preserve privacy by querying only the existing public profile view.
- Enforce the agreed 5 MB community image limit before compression/upload.

### 3. Correct Health Tracker behavior
- Use the newest reading as the current result and Smart Guidance input.
- Remove five-reading averages from classification and guidance.
- Keep historical readings only as history/trend context; do not let them change the current clinical category.
- Add focused tests for the seven-tier blood-pressure order and latest-entry selection.

### 4. Repair native flows
- Use Despia’s documented RevenueCat commands for the `Plus` offering and existing products; verify the native purchase callback triggers backend entitlement sync.
- Keep `tendhermomtest@gmail.com` as the only permanent tester bypass; all other users remain gated until backend-confirmed entitlement.
- Replace the hanging browser confirmation exit path with a Despia-native back/exit command when at the app root, retaining safe browser fallback behavior.
- Confirm contact picker and other existing Despia bridges continue to use the official SDK.

### 5. Harden SOS delivery
- Update the Termii request to the current `v3.api.termii.com` contract, with normalized phone numbers, required fields, timeout handling, and response validation.
- Never count a contact as notified unless Termii confirms acceptance.
- Return a useful per-channel failure message while keeping credentials server-side.
- Test the function with a non-delivery/safe request path first; any real SMS test will be explicitly identified before sending.

### 6. Resolve the Rescue Map external blocker
- Keep the current backend proxy and improve its user-facing error so configuration failures are distinguishable from “no nearby care.”
- User action: enable billing for the Google Cloud project attached to the configured Maps key and confirm Places API access. Then run a live nearby-healthcare test.

### 7. Release verification before publishing
- Validate login/signup screens, Home, Rescue Map, Health Tracker, Community post/comment/photo/bookmark, Baby Shower, Profile, SOS error handling, and Plus paywall at the fixed mobile viewport.
- Verify current-source marker strings in the generated release and confirm retired markers are absent.
- Run focused tests and inspect runtime/network errors.
- Publish only after the security scan is current and clear of critical findings.
- After publishing, verify the returned live URL serves the new build ID and the same release markers—no “it is fixed” claim until this comparison passes.

## External action required
Google Maps billing/Places access must be enabled in the Google Cloud account that issued the existing Maps key. App code cannot override Google’s billing rejection.
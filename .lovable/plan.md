# Fix the iPad sign-in crash Apple reported

## What Apple saw

I reproduced the exact failure using Apple's steps in a Safari-engine browser at iPad size, signed in with the demo account: the sign-in succeeds, then the app immediately shows "Something went wrong".

The demo account itself is healthy (confirmed in the database: email confirmed, not banned, profile complete, Plus active), so the credentials are not the problem.

## Root cause (confirmed, not guessed)

Right after sign-in the main app screen calls a browser speed feature named `requestIdleCallback` to pre-load secondary screens in the background. Chrome and Android have it; Safari on iPhone and iPad does not. On Apple devices the call is not just skipped — it throws an error, the main screen fails to draw, and the error screen takes over. That is why it happens only on Apple review devices.

Captured error: `ReferenceError: Can't find variable: requestIdleCallback`, thrown from the main screen (`src/pages/Index.tsx`) and caught by the app's error screen.

## The fix

1. **`src/pages/Index.tsx`** — make the background pre-load safe on Safari: check whether the browser actually supports the idle-callback feature before using it, and fall back to the existing short timer when it doesn't. Same pre-loading behaviour on Android/Chrome, no crash on iPad/iPhone.

2. **Harden the error screen** (`src/components/ErrorBoundary.tsx`) — keep the automatic one-time recovery, but make sure a reviewer is never left staring at a dead end: the retry should return to the app rather than loop.

3. **Re-run the Apple scenario in the Safari engine** at iPad Air size (1024x1366) with the demo credentials and confirm the home screen loads with the mum's week counter, the tab bar, and no console errors. I'll also re-check the phone-sized Safari view and the Chrome view so nothing regresses.

## Notes

- No changes to payments, SOS, Baby Shower, Community, or sign-in logic — the fix is limited to the startup pre-load and the error screen.
- After this ships you'll need to publish and rebuild in Despia, then resubmit with the same demo credentials; Apple's build 3.0.6 contains the crashing code.
- Two unrelated, harmless console messages appeared during testing (a realtime socket reconnect and a points-update call blocked on first load); neither breaks the app, and I'll report back if the retest shows they affect anything.

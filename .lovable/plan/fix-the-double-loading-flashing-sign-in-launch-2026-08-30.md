# Fix the double-loading, flashing sign-in launch

The launch currently plays the branded moment several times and reloads the page after the sign-in screen has already appeared. Verified causes in the current code:

1. **Two different logo renderings.** `index.html`'s boot shield shows `/pwa-192.png` (a 751 KB PNG, `object-fit: cover`, 26px radius) while `SplashScreen.tsx` shows `src/assets/logo.jpeg` (52 KB, `object-contain`). Two assets, two crops — the user sees the logo appear, disappear, then reappear "cut off". The heavy PNG also decodes slowly, so the very first frame can be blank/dark.
2. **A full page reload after the app has painted.** `applyBuildVersionGate()` runs in the background after mount. When the fetched `/release.json` build id differs from the bundled `__APP_BUILD_ID__` (which is exactly the case for a native/Despia WebView or preview running an older bundle), it calls `window.location.replace(...?v=...)` — the app is torn down and the whole boot sequence (shield → splash → login) replays. That is steps 8 and 9.
3. **A second reload path on restore.** `guardAgainstStaleRestore()` reloads on any bfcache `pageshow`, which can add another blank frame on native resume.
4. **Three separate loading visuals.** Boot shield, `SplashScreen`, and `ProtectedRoute`'s bare green spinner each paint their own screen, so the "animation" appears more than once.

## What will change

**One continuous branded moment, then the app. No reload, no repeats.**

- Use a single logo asset for both the static boot shield and the splash, at the same size, radius and object-fit, so the handoff is invisible. The shield's image is inlined/preloaded so the first painted frame is already branded (no dark or white frame).
- Replace the 751 KB boot image with a small optimised copy so the first frame paints immediately on slow connections.
- Set the document/body background to the app background colour in `index.html` so no frame can render dark or unstyled.
- The splash plays exactly once per launch and fades directly into either the login screen or the home screen. `ProtectedRoute`'s spinner is replaced by the same logo pulse so there is no third distinct visual.

**Never reload after the app is visible.**

- `applyBuildVersionGate()` stops navigating the live page. It records the newer build id and purges caches, and the fresh bundle is picked up on the *next* cold start — the user never sees a mid-session reload.
- Keep the existing one-time pre-mount purge behaviour (before React renders) so stale UI is still impossible, but the post-paint `location.replace` is removed.
- `guardAgainstStaleRestore()` only forces a reload when the restored document is from a different build, not on every bfcache restore.

## Expected launch sequence after the fix

```text
frame 1   branded logo on app background (static shield)
          -> logo animates (splash, ~1s, same logo, no jump)
          -> fade
          -> sign-in screen (or Home if already signed in)
```

No white frame, no dark frame, no repeated logo, no second login render.

## Technical notes

- Files touched: `index.html`, `src/main.tsx`, `src/lib/buildVersion.ts`, `src/lib/registerPwa.ts`, `src/components/SplashScreen.tsx`, `src/App.tsx`, `src/components/ProtectedRoute.tsx`, plus one optimised boot logo asset in `public/`.
- No auth, payment, SOS, or data logic is touched — this is boot/presentation only.
- Verification: Playwright cold-load of `/login` capturing frames at ~100 ms intervals to confirm no blank/dark frame and a single logo appearance, plus a reload-count check that the page does not navigate after mount.

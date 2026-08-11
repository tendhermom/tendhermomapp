// No app-shell service worker is used in this app.
// This module only exists to guarantee that no previously installed worker
// or cached shell can ever paint a legacy screen (e.g. the old sign-in page)
// before the current build renders.

/** Unregister ALL service workers + delete every cache on this origin. */
const cleanupStaleSW = async () => {
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(regs.map((r) => r.unregister()));
    }
    if (typeof caches !== "undefined" && caches?.keys) {
      const names = await caches.keys();
      await Promise.allSettled(names.map((n) => caches.delete(n)));
    }
  } catch (_) {
    // best effort — never block app startup
  }
};

/**
 * Awaitable startup routine: unregister any existing service workers and
 * clear caches before the app renders. Callers should `await setupPwa()`
 * prior to mounting React so users never see a stale UI.
 */
export const setupPwa = async () => {
  await cleanupStaleSW();
};

/** Fire-and-forget variant for callers that cannot await. */
export const setupPwaSync = () => {
  void cleanupStaleSW();
};

/**
 * Restoring a page from the back/forward cache can repaint the previously
 * rendered (possibly legacy) document. Force a fresh load in that case.
 */
export const guardAgainstStaleRestore = () => {
  if (typeof window === "undefined") return;
  window.addEventListener("pageshow", (event) => {
    if ((event as PageTransitionEvent).persisted) window.location.reload();
  });
};

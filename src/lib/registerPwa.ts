// No app-shell service worker is used in this app.
// This module only exists to guarantee that no previously installed worker
// or cached shell can ever paint a legacy screen (e.g. the old sign-in page)
// before the current build renders.

const LEGACY_WORKER_PATHS = ["/sw.js", "/service-worker.js"];

const isLegacyAppCache = (name: string) =>
  /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);

/** Remove only retired app-shell workers and their Workbox caches. */
const cleanupStaleSW = async () => {
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      const staleRegs = regs.filter((registration) => {
        const scriptURL = registration.active?.scriptURL
          ?? registration.waiting?.scriptURL
          ?? registration.installing?.scriptURL;
        if (!scriptURL) return false;
        try {
          const pathname = new URL(scriptURL).pathname;
          return LEGACY_WORKER_PATHS.includes(pathname);
        } catch {
          return false;
        }
      });
      await Promise.allSettled(staleRegs.map((registration) => registration.unregister()));
    }
    if (typeof caches !== "undefined" && caches?.keys) {
      const names = await caches.keys();
      await Promise.allSettled(names.filter(isLegacyAppCache).map((name) => caches.delete(name)));
    }
  } catch (_) {
    // best effort — never block app startup
  }
};

/**
 * Unregister retired app-shell workers without touching notification workers.
 * This runs in the background; rendering must never wait for browser cleanup.
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
    if (!(event as PageTransitionEvent).persisted) return;
    // Only force a fresh load when the restored document belongs to an older
    // build. Reloading on every bfcache restore adds a blank frame and makes
    // the app look like it is booting twice.
    let stored: string | null = null;
    try { stored = window.localStorage.getItem("tendher_build_id"); } catch { /* ignore */ }
    if (!stored || stored === BUILD_ID) return;
    window.location.replace(`${window.location.pathname}${window.location.search}${window.location.hash}`);
  });
};


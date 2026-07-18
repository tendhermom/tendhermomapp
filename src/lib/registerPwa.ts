// Stale app-shell service-worker cleanup.
// We intentionally do not register an app-shell SW here. Old cached builds can
// keep controlling preview/published sessions until a same-path SW replaces and
// unregisters them, so startup cleanup stays focused on removing previous app
// SW registrations and their own caches.

const isPreviewHost = (hostname: string) => {
  if (hostname.startsWith("id-preview--") || hostname.startsWith("preview--")) return true;
  if (hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com")) return true;
  if (hostname === "lovableproject-dev.com" || hostname.endsWith(".lovableproject-dev.com")) return true;
  if (hostname === "beta.lovable.dev" || hostname.endsWith(".beta.lovable.dev")) return true;
  return false;
};

const APP_SW_PATHS = ["/sw.js", "/service-worker.js"];
const APP_RUNTIME_CACHES = new Set([
  "google-fonts-stylesheets",
  "google-fonts-webfonts",
  "ionicons-cache",
  "supabase-api-cache",
  "supabase-storage-cache",
]);

const shouldClean = () => {
  if (typeof window === "undefined") return false;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true; // iframe (Lovable preview)
  if (isPreviewHost(window.location.hostname)) return true;
  return new URLSearchParams(window.location.search).get("sw") === "off";
};

const isAppWorker = (registration: ServiceWorkerRegistration) => {
  const workers = [registration.active, registration.waiting, registration.installing].filter(Boolean) as ServiceWorker[];
  return workers.some((worker) => APP_SW_PATHS.some((path) => new URL(worker.scriptURL).pathname === path));
};

const isAppCache = (name: string) => {
  const hasWorkboxBucket = /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
  const scope = typeof location !== "undefined" ? location.origin + "/" : "";
  return (hasWorkboxBucket && name.endsWith(scope)) || APP_RUNTIME_CACHES.has(name);
};

/** Unregister ALL service workers + delete every cache on this origin. */
const cleanupStaleSW = async () => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      // Purge every registration on startup so no stale worker can hijack
      // the sign-in screen. Messaging workers re-register on demand.
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
 * clear caches before the app renders the sign-in screen. Callers should
 * `await setupPwa()` prior to mounting React so users never see a stale UI
 * served from an old worker.
 */
export const setupPwa = async () => {
  await cleanupStaleSW();
};

/** Fire-and-forget variant for callers that cannot await. */
export const setupPwaSync = () => {
  void cleanupStaleSW();
};

// Keep the guarded-only helper available for legacy callers.
export const cleanupIfPreview = () => {
  if (shouldClean()) void cleanupStaleSW();
};

// Reference to keep tree-shaker + lints quiet if unused externally.
void isAppWorker;
void isAppCache;


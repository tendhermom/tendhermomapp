/**
 * Versioned asset + cache-busting strategy.
 *
 * Every build gets a unique id injected at compile time (see `vite.config.ts`).
 * On startup we compare it with the id the browser last booted with. When they
 * differ, we purge caches/stale keys and perform exactly ONE hard refresh so no
 * stale shell (e.g. a legacy auth screen) can survive a deployment.
 */

declare const __APP_BUILD_ID__: string;

export const BUILD_ID: string =
  typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : "dev";

const BUILD_KEY = "tendher_build_id";
const REFRESH_FLAG = "tendher_build_refresh"; // sessionStorage — loop guard

const safeGet = (store: Storage | undefined, key: string) => {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const safeSet = (store: Storage | undefined, key: string, value: string) => {
  try {
    store?.setItem(key, value);
  } catch {
    /* ignore */
  }
};

const getLatestPublishedBuild = async (): Promise<string | null> => {
  if (BUILD_ID === "dev" || typeof window === "undefined") return null;

  try {
    const manifestUrl = new URL("/release.json", window.location.origin);
    manifestUrl.searchParams.set("t", Date.now().toString());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    let response: Response;
    try {
      response = await fetch(manifestUrl.toString(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) return null;
    const payload = await response.json();
    return typeof payload?.buildId === "string" && payload.buildId.length > 0
      ? payload.buildId
      : null;
  } catch {
    return null;
  }
};

const purgeCaches = async () => {
  try {
    if (typeof caches !== "undefined" && caches?.keys) {
      const names = await caches.keys();
      await Promise.allSettled(names.map((name) => caches.delete(name)));
    }
  } catch {
    /* best effort */
  }
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(
        regs
          .filter((r) => {
            const url =
              r.active?.scriptURL ?? r.waiting?.scriptURL ?? r.installing?.scriptURL ?? "";
            // Never touch messaging workers (push notifications).
            return !url.includes("firebase-messaging") && !url.includes("OneSignal");
          })
          .map((r) => r.unregister()),
      );
    }
  } catch {
    /* best effort */
  }
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("tendher_nav") || k.startsWith("tendher_legacy") || k.startsWith("workbox")) {
        localStorage.removeItem(k);
      }
    });
  } catch {
    /* ignore */
  }
};

/**
 * Purges stale caches in the background. It NEVER navigates or reloads the
 * live page — a reload after first paint replays the whole launch sequence
 * (shield -> splash -> login) and looks like the app booting twice.
 * A newer deployment is simply picked up on the next cold start.
 *
 * Always resolves false (kept for callers that check the old contract).
 */
export const applyBuildVersionGate = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  const latestPublishedBuild = await getLatestPublishedBuild();
  if (latestPublishedBuild && latestPublishedBuild !== BUILD_ID) {
    // Newer build exists: clear caches now so the NEXT launch loads it fresh.
    await purgeCaches();
    safeSet(window.localStorage, BUILD_KEY, latestPublishedBuild);
    return false;
  }

  const previous = safeGet(window.localStorage, BUILD_KEY);
  if (previous === BUILD_ID) return false;

  await purgeCaches();
  safeSet(window.localStorage, BUILD_KEY, BUILD_ID);
  safeSet(window.sessionStorage, REFRESH_FLAG, BUILD_ID);
  return false;

};

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
    const response = await fetch(manifestUrl.toString(), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
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
 * Returns true when a hard refresh was triggered (caller should stop booting).
 * Runs before React mounts.
 */
export const applyBuildVersionGate = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  // A cache-busted release manifest lets an already-open native WebView detect
  // a newer deployment even if it retained the previous HTML document.
  const latestPublishedBuild = await getLatestPublishedBuild();
  if (latestPublishedBuild && latestPublishedBuild !== BUILD_ID) {
    document.getElementById("root")?.replaceChildren();
    await purgeCaches();
    safeSet(window.localStorage, BUILD_KEY, latestPublishedBuild);
    safeSet(window.sessionStorage, REFRESH_FLAG, latestPublishedBuild);

    const freshUrl = new URL(window.location.href);
    freshUrl.searchParams.set("v", latestPublishedBuild);
    window.location.replace(freshUrl.toString());
    return true;
  }

  const previous = safeGet(window.localStorage, BUILD_KEY);
  if (previous === BUILD_ID) return false;

  // Clear any browser/WebView-restored app DOM before cache cleanup or a
  // version reload. index.html's boot shield remains visible above the root.
  document.getElementById("root")?.replaceChildren();

  await purgeCaches();
  safeSet(window.localStorage, BUILD_KEY, BUILD_ID);

  // Only one refresh per session, per build — never loop.
  const alreadyRefreshed = safeGet(window.sessionStorage, REFRESH_FLAG) === BUILD_ID;
  if (previous === null || alreadyRefreshed) return false;

  safeSet(window.sessionStorage, REFRESH_FLAG, BUILD_ID);

  const url = new URL(window.location.href);
  url.searchParams.set("v", BUILD_ID);
  window.location.replace(url.toString());
  return true;
};

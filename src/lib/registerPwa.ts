// Guarded PWA service-worker registration.
// The SW must ONLY run on the real published app — never in dev, the Lovable
// editor preview, or any iframe. In those contexts we actively unregister any
// stale app SW and purge its caches so users always see the latest version.

const isPreviewHost = (hostname: string) => {
  if (hostname.startsWith("id-preview--") || hostname.startsWith("preview--")) return true;
  if (hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com")) return true;
  if (hostname === "lovableproject-dev.com" || hostname.endsWith(".lovableproject-dev.com")) return true;
  if (hostname === "beta.lovable.dev" || hostname.endsWith(".beta.lovable.dev")) return true;
  return false;
};

const shouldRegister = () => {
  if (!import.meta.env.PROD) return false;
  if (typeof window === "undefined") return false;
  if (window.self !== window.top) return false; // iframe (Lovable preview)
  if (isPreviewHost(window.location.hostname)) return false;
  if (new URLSearchParams(window.location.search).has("sw") &&
      new URLSearchParams(window.location.search).get("sw") === "off") return false;
  return true;
};

/** Unregister any app service workers + delete their caches. */
const cleanupStaleSW = async () => {
  try {
    if ("serviceWorker" in navigator) {
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

export const setupPwa = () => {
  if (!shouldRegister()) {
    // Dev / preview / iframe / ?sw=off — make sure no stale SW hijacks loads.
    void cleanupStaleSW();
    return;
  }

  // Production, top-level, published domain: register with silent background updates.
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onRegisteredSW(_swUrl, registration) {
          if (registration) {
            setInterval(() => registration.update().catch(() => {}), 60_000);
          }
        },
      });
    })
    .catch(() => {});
};

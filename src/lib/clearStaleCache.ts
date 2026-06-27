// Clear stale PWA caches and service workers on login so returning users
// always see the current release (welcome screen, removed media, etc.).
// Safe to call in any environment; failures are swallowed.

const PRESERVE_LOCAL_KEYS = new Set([
  "has_logged_in",
  "onboarding_completed",
  "intro_seen",
]);

export async function clearStaleCache(): Promise<void> {
  try {
    if (typeof caches !== "undefined" && caches?.keys) {
      const names = await caches.keys();
      await Promise.allSettled(names.map((n) => caches.delete(n)));
    }
  } catch (_) {}

  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(
        regs
          .filter((r) => {
            const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
            // Preserve push/messaging workers (Firebase, OneSignal)
            return !/firebase-messaging-sw|OneSignalSDK/i.test(url);
          })
          .map((r) => r.unregister()),
      );
    }
  } catch (_) {}

  try {
    // Drop transient UI caches but keep auth/session-critical keys
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (PRESERVE_LOCAL_KEYS.has(key)) continue;
      if (key.startsWith("sb-")) continue; // supabase auth
      if (key.startsWith("cache:") || key.startsWith("query:") || key.startsWith("ui:")) {
        toRemove.push(key);
      }
    }
    toRemove.forEach((k) => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
  } catch (_) {}
}

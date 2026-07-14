// Temporary app-shell cache kill switch.
// This replaces any previously deployed Workbox/VitePWA worker at /sw.js,
// clears only this app worker's caches, refreshes open tabs, then unregisters.
function isWorkboxCacheForThisRegistration(name) {
  const hasWorkboxBucket = /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
  return hasWorkboxBucket && name.endsWith(self.registration.scope);
}

const appRuntimeCaches = new Set([
  "google-fonts-stylesheets",
  "google-fonts-webfonts",
  "ionicons-cache",
  "supabase-api-cache",
  "supabase-storage-cache",
]);

function isAppCache(name) {
  return isWorkboxCacheForThisRegistration(name) || appRuntimeCaches.has(name);
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const appCacheNames = cacheNames.filter(isAppCache);
        await Promise.allSettled(appCacheNames.map((name) => caches.delete(name)));
        await self.clients.claim();
        const windowClients = await self.clients.matchAll({ type: "window" });
        await Promise.allSettled(windowClients.map((client) => client.navigate(client.url)));
      } finally {
        await self.registration.unregister();
      }
    })(),
  ),
);
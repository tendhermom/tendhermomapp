import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { initSentry } from "./lib/sentry";
import { initOneSignal } from "./lib/onesignal";
import { initDespia } from "./lib/despia";

// Initialize production services
initSentry();
initOneSignal();
initDespia();

// One-time stale-cache purge for users on outdated builds (e.g. removed
// "How Triage Works" video, old welcome name). Bump RELEASE_TAG whenever
// shipping a release that must invalidate workbox precaches.
const RELEASE_TAG = "2026-06-29-no-triage-video";
try {
  if (typeof localStorage !== "undefined" && localStorage.getItem("release_tag") !== RELEASE_TAG) {
    if (typeof caches !== "undefined" && caches?.keys) {
      caches.keys().then((names) => {
        names.forEach((n) => caches.delete(n).catch(() => {}));
      }).catch(() => {});
    }
    localStorage.setItem("release_tag", RELEASE_TAG);
  }
} catch (_) {}


// Register the PWA service worker but DO NOT force-reload the app while it
// is in the foreground. New builds activate silently and take effect on the
// user's next cold start, so users don't get thrown back to Home mid-session.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      // Poll for updates in the background so the new SW is ready to activate
      // on the next launch. No reload — no disruption.
      setInterval(() => registration.update().catch(() => {}), 60_000);
    }
  },
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

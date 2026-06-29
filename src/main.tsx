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


// Auto-update PWA: reload immediately when a new service worker takes control
// so users never get stuck on a stale build.
registerSW({
  immediate: true,
  onNeedRefresh() {
    // New version available — activate and reload right away.
    window.location.reload();
  },
  onRegisteredSW(_swUrl, registration) {
    // Poll for updates every 60s while the app is open.
    if (registration) {
      setInterval(() => registration.update().catch(() => {}), 60_000);
    }
  },
});

// If the active SW changes (new build took over), reload once.
if ("serviceWorker" in navigator) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

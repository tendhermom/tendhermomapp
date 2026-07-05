import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { initSentry } from "./lib/sentry";
import { initOneSignal } from "./lib/onesignal";
import { initDespia } from "./lib/despia";
import { reportError } from "./lib/errorMessage";
import { setupPwa } from "./lib/registerPwa";

// Initialize production services
initSentry();
initOneSignal();
initDespia();

// Global safety net — catch unhandled JS runtime errors and promise rejections
// so mums get a friendly toast + we still get Sentry events instead of silent crashes.
const isNoise = (msg: string, filename?: string) => {
  const s = (msg || "").toLowerCase();
  if (filename?.includes("extension://")) return true;
  if (s.includes("resizeobserver loop")) return true;
  if (s === "script error." || s === "script error") return true;
  return false;
};

if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    if (isNoise(e.message, e.filename)) return;
    reportError(e.error ?? new Error(e.message), {
      feature: "window.onerror",
      context: { filename: e.filename, lineno: e.lineno, colno: e.colno },
    });
  });
  window.addEventListener("unhandledrejection", (e) => {
    const reason: any = e.reason;
    const msg = (reason?.message || String(reason || "")).toLowerCase();
    if (isNoise(msg)) return;
    reportError(reason ?? new Error("Unhandled promise rejection"), {
      feature: "unhandledrejection",
    });
  });
}

// One-time stale-cache purge for users on outdated builds. Bump RELEASE_TAG
// whenever shipping a release that must invalidate workbox precaches.
const RELEASE_TAG = "2026-07-05-fresh-preview";
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

// Guarded PWA setup: registers the service worker ONLY on the published app.
// In dev / Lovable preview / iframes it unregisters stale workers and purges
// caches so the preview always shows the latest version.
setupPwa();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

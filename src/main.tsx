import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { initSentry } from "./lib/sentry";
import { initOneSignal } from "./lib/onesignal";
import { initDespia } from "./lib/despia";
import { reportError } from "./lib/errorMessage";
import { setupPwa, guardAgainstStaleRestore } from "./lib/registerPwa";
import { applyBuildVersionGate } from "./lib/buildVersion";
import { captureLaunchDeepLink } from "./lib/deeplinks";
import { registerRevenueCatHandlers } from "./lib/revenuecat";

// Remove any DOM restored by the browser/WebView before asynchronous startup
// work begins. The static boot shield in index.html stays above the root until
// the current React tree is committed, so an older auth screen cannot flash.
const rootElement = document.getElementById("root");
rootElement?.replaceChildren();

// Initialize production services
initSentry();
initOneSignal();
initDespia();
// Capture any deep link the app was launched with before routing starts.
captureLaunchDeepLink();
// RevenueCat runtime callbacks (purchase + Customer Center) — registered once.
registerRevenueCatHandlers();

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

const mount = () => {
  if (!rootElement) return;
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  document.getElementById("app-boot-shield")?.remove();
};

guardAgainstStaleRestore();

// Versioned build gate: after each deployment this purges caches/workers and
// performs exactly one hard refresh, so stale auth UI can never resurface.
void applyBuildVersionGate().then((refreshing) => {
  if (refreshing) return; // page is navigating away — don't mount the old bundle
  mount();
  void setupPwa();
}).catch(() => {
  // A failed cache check must not block the current app, but unlike the old
  // timer this cannot race with a refresh that is still in progress.
  mount();
  void setupPwa();
});


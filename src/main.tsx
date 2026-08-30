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
  // Remove the boot shield only after React has painted, so there is no
  // white flash between the static shield and the app's first frame.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById("app-boot-shield")?.remove();
    });
  });
};

guardAgainstStaleRestore();

// Mount immediately — never block first paint on a network check (this was
// the source of the 30–60s white-screen delay on slow connections).
mount();
void setupPwa();

// Stale-build check runs in the background after mount. When a newer
// deployment is detected it purges caches and performs exactly one hard
// refresh; otherwise the running app is untouched.
void applyBuildVersionGate().catch(() => {});


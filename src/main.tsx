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
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

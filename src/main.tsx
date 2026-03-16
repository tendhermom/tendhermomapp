import { createRoot } from "react-dom/client";
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

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { initSentry } from "./lib/sentry";
import { initOneSignal } from "./lib/onesignal";

// Initialize production services
initSentry();
initOneSignal();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

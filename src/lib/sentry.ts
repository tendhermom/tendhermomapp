import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "https://b647123febcc9094ef0070823703e271@o4511102285381632.ingest.de.sentry.io/4511102384472144";

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.log("[Sentry] No DSN configured — error monitoring disabled");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: 0.1, // 10% of transactions for performance
    replaysSessionSampleRate: 0.05, // 5% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    environment: import.meta.env.MODE,
    beforeSend(event) {
      // Filter out noisy browser extension errors
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        (frame) => frame.filename?.includes("extension://")
      )) {
        return null;
      }
      return event;
    },
  });
};

export { Sentry };

import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  recovering: boolean;
}

const RECOVERY_KEY = "eb_recovered_at";
const RECOVERY_COOLDOWN_MS = 60_000; // don't auto-recover more than once per minute

/**
 * Top-level error boundary. Catches render-time errors anywhere in the tree.
 *
 * iPad/Safari hardening:
 *  - If we hit an error and we haven't auto-recovered recently, we transparently
 *    unregister any stale service workers + clear caches, then reload once. This
 *    is the most common cause of "white screen after login" on iPad: a cached
 *    JS chunk from a previous build trying to run against current server code.
 *  - Manual "Refresh App" always nukes the SW + caches before reloading.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "", recovering: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, errorMessage: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Surface for Sentry / console diagnostics during Apple review.
    console.error("[ErrorBoundary]", error, errorInfo);

    // Attempt a one-time silent recovery from stale-cache / stale-SW situations.
    let lastRecovery = 0;
    try {
      lastRecovery = Number(localStorage.getItem(RECOVERY_KEY) || 0);
    } catch (_) {
      /* private mode etc. */
    }
    const now = Date.now();
    if (now - lastRecovery > RECOVERY_COOLDOWN_MS) {
      try {
        localStorage.setItem(RECOVERY_KEY, String(now));
      } catch (_) {
        /* ignore */
      }
      this.setState({ recovering: true });
      void this.hardReload();
    }
  }

  hardReload = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
      }
    } catch (_) {
      /* swallow — we're already in an error state */
    }
    // Force a fresh fetch from the server.
    window.location.replace(window.location.pathname + window.location.search);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-6"
          style={{ background: "hsl(30 14% 96%)" }}
        >
          <div className="text-center max-w-[320px]">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "hsl(14 82% 96%)" }}
            >
              <span className="text-[28px]">⚠️</span>
            </div>
            <h2
              className="text-[20px] font-bold mb-2"
              style={{ fontFamily: "'DM Serif Display', serif", color: "hsl(0 0% 10%)" }}
            >
              {this.state.recovering ? "Refreshing…" : "Something went wrong"}
            </h2>
            <p
              className="text-[14px] mb-6"
              style={{ fontFamily: "'Poppins', sans-serif", color: "hsl(0 0% 54%)" }}
            >
              {this.state.recovering
                ? "We're loading the latest version. One moment…"
                : "We're sorry for the inconvenience. Please try refreshing the page."}
            </p>
            {!this.state.recovering && (
              <button
                onClick={() => {
                  this.setState({ recovering: true });
                  void this.hardReload();
                }}
                className="px-6 py-3 rounded-2xl text-[15px] font-semibold"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  background: "hsl(153 42% 30%)",
                  color: "white",
                }}
              >
                Refresh App
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

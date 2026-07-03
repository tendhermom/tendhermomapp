/**
 * Maps raw Supabase / network / JS errors into short, mum-friendly messages.
 * Also logs the technical details to Sentry so we still get full diagnostics.
 */
import { Sentry } from "@/lib/sentry";
import { toast } from "sonner";

type AnyError = unknown;

interface FriendlyOptions {
  /** Short fallback shown if no specific match is found. */
  fallback?: string;
  /** Sentry feature tag for filtering. */
  feature?: string;
  /** Extra structured context sent to Sentry. */
  context?: Record<string, unknown>;
  /** Suppress the toast (only log). */
  silent?: boolean;
}

/** Returns a short human-readable string for a given error. */
export function friendlyErrorMessage(err: AnyError, fallback = "Something went wrong. Please try again."): string {
  if (!err) return fallback;

  const anyErr = err as any;
  const raw = (anyErr?.message || anyErr?.error_description || anyErr?.error || anyErr?.msg || "").toString();
  const code = (anyErr?.code || anyErr?.status || "").toString();
  const low = raw.toLowerCase();

  // Network / offline
  if (low.includes("failed to fetch") || low.includes("networkerror") || low.includes("network request failed") || low.includes("load failed")) {
    return "You appear to be offline. Please check your connection and try again.";
  }
  if (low.includes("timeout") || low.includes("timed out")) {
    return "That took too long. Please try again in a moment.";
  }
  if (low.includes("aborted")) {
    return "The request was cancelled. Please try again.";
  }

  // Auth
  if (low.includes("invalid login credentials") || low.includes("invalid credentials")) {
    return "That email or password doesn't match. Please try again.";
  }
  if (low.includes("email not confirmed")) {
    return "Please verify your email before signing in.";
  }
  if (low.includes("user already registered") || low.includes("already exists")) {
    return "An account with that email already exists. Try signing in instead.";
  }
  if (low.includes("password") && low.includes("weak")) {
    return "Please choose a stronger password (8+ characters).";
  }
  if (low.includes("jwt") || low.includes("token") && (low.includes("expired") || low.includes("invalid"))) {
    return "Your session has expired. Please sign in again.";
  }

  // Supabase / Postgres common
  if (code === "PGRST116" || low.includes("no rows")) {
    return "We couldn't find that item. It may have been removed.";
  }
  if (code === "23505" || low.includes("duplicate key")) {
    return "That item already exists.";
  }
  if (code === "23503" || low.includes("foreign key")) {
    return "This action isn't allowed right now.";
  }
  if (code === "23502" || low.includes("not-null") || low.includes("null value")) {
    return "Please fill in all the required fields.";
  }
  if (code === "42501" || low.includes("permission denied") || low.includes("row-level security") || low.includes("violates row-level")) {
    return "You don't have permission to do that.";
  }
  if (code === "429" || low.includes("too many") || low.includes("rate limit")) {
    return "You're doing that a bit too fast. Please wait a moment and try again.";
  }
  if (code === "401" || code === "403") {
    return "Please sign in again to continue.";
  }
  if (code.startsWith("5") || low.includes("internal server error")) {
    return "Our servers are having a moment. Please try again shortly.";
  }

  // Storage
  if (low.includes("payload too large") || low.includes("file too large")) {
    return "That file is too large. Please choose a smaller one.";
  }
  if (low.includes("bucket") && low.includes("not found")) {
    return "Upload storage isn't available right now. Please try again later.";
  }

  return fallback;
}

/** Log to Sentry + show a friendly toast. Returns the friendly string. */
export function reportError(err: AnyError, opts: FriendlyOptions = {}): string {
  const msg = friendlyErrorMessage(err, opts.fallback);
  try {
    Sentry.captureException(err instanceof Error ? err : new Error(String((err as any)?.message ?? err)), {
      tags: opts.feature ? { feature: opts.feature } : undefined,
      extra: {
        friendly: msg,
        raw: (err as any)?.message ?? String(err),
        code: (err as any)?.code,
        status: (err as any)?.status,
        ...opts.context,
      },
    });
  } catch { /* never let logging throw */ }
  console.error(`[${opts.feature || "app"}]`, err);
  if (!opts.silent) toast.error(msg);
  return msg;
}

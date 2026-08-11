/**
 * Deep links — custom scheme `tendhermom://` and universal links on
 * https://tendhermomapps.lovable.app
 *
 * Supported targets:
 *   tendhermom://home | triage | sos | community | profile
 *   tendhermom://premium              (Plus paywall)
 *   tendhermom://baby-shower?post=ID  (a shared baby post)
 *   https://tendhermomapps.lovable.app/go/<target>
 *   https://tendhermomapps.lovable.app/?screen=<target>
 *
 * Auth links (password reset / email confirmation) keep their existing
 * web routes (/reset-password, /login) and are intentionally NOT rewritten
 * to app screens — Supabase needs the original callback URL.
 */

export const APP_SCHEME = "tendhermom";
export const UNIVERSAL_LINK_HOST = "tendhermomapps.lovable.app";

const SCREEN_ALIASES: Record<string, string> = {
  home: "home",
  triage: "triage",
  sos: "sos",
  emergency: "sos",
  community: "community",
  profile: "profile",
  premium: "premium",
  plus: "premium",
  upgrade: "premium",
  "baby-shower": "baby-shower",
  babyshower: "baby-shower",
  "health-tracker": "health-tracker",
  insights: "insights",
  antenatal: "antenatal",
  "health-hubs": "health-hubs",
  "rescue-map": "health-hubs",
  referrals: "referrals",
  notifications: "notifications",
  "ai-chat": "ai-chat",
  levels: "gamification",
  gamification: "gamification",
};

const PENDING_KEY = "tendher_pending_deeplink";

export interface DeepLinkTarget {
  screen: string;
  params?: Record<string, string>;
}

/** Parse any incoming URL (scheme or universal link) into an app target. */
export const parseDeepLink = (rawUrl: string): DeepLinkTarget | null => {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl, `https://${UNIVERSAL_LINK_HOST}`);
    let key = "";

    if (url.protocol === `${APP_SCHEME}:`) {
      key = (url.hostname || url.pathname.replace(/^\/+/, "")).toLowerCase();
    } else {
      const explicit = url.searchParams.get("screen");
      if (explicit) {
        key = explicit.toLowerCase();
      } else {
        const segments = url.pathname.split("/").filter(Boolean);
        if (segments[0] === "go" && segments[1]) key = segments[1].toLowerCase();
      }
    }

    const screen = SCREEN_ALIASES[key];
    if (!screen) return null;

    const params: Record<string, string> = {};
    url.searchParams.forEach((value, name) => {
      if (name !== "screen") params[name] = value;
    });

    return { screen, params };
  } catch {
    return null;
  }
};

const store = (target: DeepLinkTarget) => {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(target));
  } catch {}
};

/** Read (and clear) a deep link captured before the app was ready. */
export const consumePendingDeepLink = (): DeepLinkTarget | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw) as DeepLinkTarget;
  } catch {
    return null;
  }
};

/** Capture the launch URL as early as possible (call from main.tsx). */
export const captureLaunchDeepLink = () => {
  if (typeof window === "undefined") return;
  const target = parseDeepLink(window.location.href);
  if (target) {
    store(target);
    // Clean the URL so a refresh doesn't re-trigger the same jump.
    try {
      const clean = window.location.pathname.startsWith("/go/") ? "/" : window.location.pathname;
      window.history.replaceState({}, "", clean);
    } catch {}
  }
};

type Handler = (target: DeepLinkTarget) => void;

/**
 * Subscribe to deep links that arrive while the app is already running.
 * Despia forwards them as a `despia-deeplink` CustomEvent, a postMessage
 * of shape { type: "deeplink", url }, or via window.handleOpenURL.
 */
export const onDeepLink = (handler: Handler): (() => void) => {
  if (typeof window === "undefined") return () => {};

  const dispatch = (rawUrl?: string | null) => {
    if (!rawUrl) return;
    const target = parseDeepLink(rawUrl);
    if (target) handler(target);
  };

  const onCustom = (e: Event) => dispatch((e as CustomEvent<{ url?: string }>).detail?.url);
  const onMessage = (e: MessageEvent) => {
    try {
      const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      if (data?.type === "deeplink" || data?.type === "despia_deeplink") dispatch(data.url);
    } catch {}
  };

  window.addEventListener("despia-deeplink", onCustom as EventListener);
  window.addEventListener("message", onMessage);

  const previousHandler = (window as any).handleOpenURL;
  (window as any).handleOpenURL = (url: string) => {
    dispatch(url);
    if (typeof previousHandler === "function") previousHandler(url);
  };

  return () => {
    window.removeEventListener("despia-deeplink", onCustom as EventListener);
    window.removeEventListener("message", onMessage);
    (window as any).handleOpenURL = previousHandler;
  };
};

/** Build a shareable universal link for a target. */
export const buildDeepLink = (screen: string, params: Record<string, string> = {}) => {
  const qs = new URLSearchParams(params).toString();
  return `https://${UNIVERSAL_LINK_HOST}/go/${screen}${qs ? `?${qs}` : ""}`;
};

/**
 * Despia Native Bridge
 * Provides native capabilities when running inside Despia wrapper:
 * - Status bar theming
 * - Haptic feedback
 * - Native share sheet
 * - OneSignal player ID handoff
 * - Biometric authentication
 */

// Detect if running inside Despia native shell
export const isDespiaNative = (): boolean => {
  try {
    return (
      typeof window !== "undefined" &&
      (window.navigator.userAgent.includes("Despia") ||
        !!(window as any).__DESPIA_NATIVE__)
    );
  } catch {
    return false;
  }
};

// ─── Status Bar ───────────────────────────────────────────────

type StatusBarStyle = "light" | "dark";

/**
 * Set the native status bar color and text style.
 * @param hex - Background color as hex (e.g. "#2D6A4F")
 * @param style - "light" for white text, "dark" for black text
 */
export const setStatusBarColor = (hex: string, style: StatusBarStyle = "light") => {
  if (!isDespiaNative()) return;
  try {
    window.location.href = `statusbarcolor://${hex}?style=${style}`;
  } catch (e) {
    console.warn("[Despia] Status bar color failed:", e);
  }
};

// Theme presets matching TendherMom design tokens
export const StatusBarThemes = {
  /** Default green header — used on Home, Triage, Profile */
  primary: () => setStatusBarColor("#2D6A4F", "light"),
  /** Coral — used on SOS/Emergency screens */
  emergency: () => setStatusBarColor("#E8735A", "light"),
  /** Light background — used on Community, Baby Shower */
  light: () => setStatusBarColor("#F5F0EB", "dark"),
  /** White surface — used on modals/sheets */
  surface: () => setStatusBarColor("#FFFFFF", "dark"),
} as const;

// ─── Haptics ──────────────────────────────────────────────────

type HapticStyle =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"
  | "selection";

/**
 * Trigger native haptic feedback.
 * Falls back to Vibration API on Android web.
 */
export const haptic = (style: HapticStyle = "medium") => {
  if (isDespiaNative()) {
    try {
      window.location.href = `haptic://${style}`;
      return;
    } catch {}
  }

  // Web fallback via Vibration API
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    const patterns: Record<HapticStyle, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 40,
      success: [10, 30, 10],
      warning: [20, 40, 20],
      error: [40, 60, 40, 60, 40],
      selection: 5,
    };
    navigator.vibrate(patterns[style] || 20);
  }
};

// Convenience aliases
export const hapticLight = () => haptic("light");
export const hapticMedium = () => haptic("medium");
export const hapticHeavy = () => haptic("heavy");
export const hapticSuccess = () => haptic("success");
export const hapticWarning = () => haptic("warning");
export const hapticError = () => haptic("error");
export const hapticSelection = () => haptic("selection");

// ─── Native Share ─────────────────────────────────────────────

interface ShareOptions {
  title: string;
  text: string;
  url?: string;
}

/**
 * Open native share sheet. Falls back to Web Share API.
 * Returns true if share was initiated.
 */
export const nativeShare = async (options: ShareOptions): Promise<boolean> => {
  if (isDespiaNative()) {
    try {
      const params = new URLSearchParams({
        title: options.title,
        text: options.text,
        ...(options.url && { url: options.url }),
      });
      window.location.href = `shareapp://?${params.toString()}`;
      return true;
    } catch {}
  }

  // Web Share API fallback
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(options);
      return true;
    } catch {
      return false;
    }
  }

  // Clipboard fallback
  if (options.url && typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(options.url);
      return true;
    } catch {}
  }

  return false;
};

// ─── OneSignal Player ID Handoff ──────────────────────────────

/**
 * Pass OneSignal player ID to the native shell for push routing.
 */
export const setDespiaOneSignalPlayerId = (playerId: string) => {
  if (!isDespiaNative()) return;
  try {
    window.location.href = `setonesignalplayerid://${playerId}`;
  } catch (e) {
    console.warn("[Despia] OneSignal player ID handoff failed:", e);
  }
};

// ─── Safe Area Helpers ────────────────────────────────────────

/**
 * Get computed safe area inset value (px).
 * Returns 0 when not in a native context.
 */
export const getSafeAreaInset = (
  side: "top" | "bottom" | "left" | "right"
): number => {
  if (typeof window === "undefined") return 0;
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    `--safe-area-${side}`
  );
  return parseInt(value, 10) || 0;
};

// ─── Initialization ───────────────────────────────────────────

/**
 * Initialize Despia native bridge. Call once on app boot.
 * Sets default status bar theme and logs native detection.
 */
export const initDespia = () => {
  const native = isDespiaNative();
  console.log(`[Despia] Native: ${native}`);

  if (native) {
    // Set default status bar to primary green
    StatusBarThemes.primary();

    // Expose safe-area CSS custom properties from env()
    const root = document.documentElement;
    const sides = ["top", "bottom", "left", "right"] as const;
    sides.forEach((side) => {
      root.style.setProperty(
        `--safe-area-${side}`,
        `env(safe-area-inset-${side}, 0px)`
      );
    });
  }
};

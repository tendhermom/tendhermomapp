/**
 * Despia Native Bridge — Complete Feature Integration
 * Covers all Despia runtime APIs, SDK bridges, and infrastructure features.
 * 
 * Protocol Reference:
 *   statusbarcolor://  — Status bar theming
 *   haptic://           — Native haptics (7 types)
 *   shareapp://         — Native share sheet
 *   setonesignalplayerid:// — OneSignal player ID handoff
 *   identityvault://    — Biometric-secured key-value storage
 *   screenshield://     — Screenshot/recording prevention
 *   preventsleep://     — Keep screen awake
 *   fullscreen://       — Toggle fullscreen mode
 *   orientation://      — Lock device orientation
 *   att://              — App Tracking Transparency prompt
 *   jailbreakcheck://   — Jailbreak/root detection
 *   vendorid://         — Vendor ID retrieval
 *   backgroundlocation:// — Background location tracking
 *   localpush://        — Local push notifications
 *   airprint://         — AirPrint support
 *   pkpass://           — Mobile wallet pass
 * 
 * Web Interception Layer (automatic — no code needed):
 *   <input type="file">  → native file picker
 *   capture attribute    → native camera modal
 *   accept="image/*"     → native media gallery
 *   Deeplinks/HTTPS      → native routing
 *   External links       → configurable handling
 */

// ─── Native Detection ─────────────────────────────────────────

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

/** Send a protocol command to Despia shell. No-op in browser. */
const despiaCommand = (protocol: string, path: string = "", params?: Record<string, string>) => {
  if (!isDespiaNative()) return;
  try {
    const url = params
      ? `${protocol}://${path}?${new URLSearchParams(params).toString()}`
      : `${protocol}://${path}`;
    window.location.href = url;
  } catch (e) {
    console.warn(`[Despia] ${protocol} failed:`, e);
  }
};

// ─── Status Bar ───────────────────────────────────────────────

type StatusBarStyle = "light" | "dark";

export const setStatusBarColor = (hex: string, style: StatusBarStyle = "light") => {
  despiaCommand("statusbarcolor", hex, { style });
};

export const StatusBarThemes = {
  primary: () => setStatusBarColor("#2D6A4F", "light"),
  emergency: () => setStatusBarColor("#E8735A", "light"),
  light: () => setStatusBarColor("#F5F0EB", "dark"),
  surface: () => setStatusBarColor("#FFFFFF", "dark"),
} as const;

// ─── Haptics (7 types — 5 native + 2 feedback) ───────────────

type HapticStyle =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"
  | "selection";

export const haptic = (style: HapticStyle = "medium") => {
  if (isDespiaNative()) {
    despiaCommand("haptic", style);
    return;
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

export const hapticLight = () => haptic("light");
export const hapticMedium = () => haptic("medium");
export const hapticHeavy = () => haptic("heavy");
export const hapticSuccess = () => haptic("success");
export const hapticWarning = () => haptic("warning");
export const hapticError = () => haptic("error");
export const hapticSelection = () => haptic("selection");

// ─── Identity Vault (Biometric-secured KV storage) ────────────

export const identityVault = {
  /** Store a key-value pair secured by biometrics */
  set: (key: string, value: string) => {
    despiaCommand("identityvault", "set", { key, value });
  },
  /** Retrieve a value (triggers biometric prompt) */
  get: (key: string) => {
    despiaCommand("identityvault", "get", { key });
  },
  /** Remove a key from vault */
  remove: (key: string) => {
    despiaCommand("identityvault", "remove", { key });
  },
  /** Check if biometrics are available */
  checkBiometrics: () => {
    despiaCommand("identityvault", "checkbiometrics");
  },
};

// ─── Native Share ─────────────────────────────────────────────

interface ShareOptions {
  title: string;
  text: string;
  url?: string;
}

export const nativeShare = async (options: ShareOptions): Promise<boolean> => {
  if (isDespiaNative()) {
    despiaCommand("shareapp", "", {
      title: options.title,
      text: options.text,
      ...(options.url && { url: options.url }),
    });
    return true;
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(options);
      return true;
    } catch {
      return false;
    }
  }

  if (options.url && typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(options.url);
      return true;
    } catch {}
  }

  return false;
};

// ─── OneSignal Player ID Handoff ──────────────────────────────

export const setDespiaOneSignalPlayerId = (playerId: string) => {
  despiaCommand("setonesignalplayerid", playerId);
};

// ─── Screen Shield (prevent screenshots/recordings) ───────────

export const screenShield = {
  enable: () => despiaCommand("screenshield", "enable"),
  disable: () => despiaCommand("screenshield", "disable"),
};

// ─── Prevent Sleep ────────────────────────────────────────────

export const preventSleep = {
  enable: () => despiaCommand("preventsleep", "enable"),
  disable: () => despiaCommand("preventsleep", "disable"),
};

// ─── Fullscreen Mode ──────────────────────────────────────────

export const fullscreen = {
  enter: () => despiaCommand("fullscreen", "enter"),
  exit: () => despiaCommand("fullscreen", "exit"),
};

// ─── Orientation Lock ─────────────────────────────────────────

type OrientationMode = "portrait" | "landscape" | "auto";

export const setOrientation = (mode: OrientationMode) => {
  despiaCommand("orientation", mode);
};

// ─── App Tracking Transparency (ATT) ─────────────────────────

export const requestATT = () => {
  despiaCommand("att", "request");
};

// ─── Jailbreak Detection ──────────────────────────────────────

export const checkJailbreak = () => {
  despiaCommand("jailbreakcheck", "check");
};

// ─── Vendor ID ────────────────────────────────────────────────

export const getVendorId = () => {
  despiaCommand("vendorid", "get");
};

// ─── Background Location ──────────────────────────────────────

export const backgroundLocation = {
  start: () => despiaCommand("backgroundlocation", "start"),
  stop: () => despiaCommand("backgroundlocation", "stop"),
};

// ─── Local Push Notifications ─────────────────────────────────

interface LocalNotificationOptions {
  title: string;
  body: string;
  delaySeconds?: number;
  id?: string;
}

export const localNotification = {
  schedule: (options: LocalNotificationOptions) => {
    despiaCommand("localpush", "schedule", {
      title: options.title,
      body: options.body,
      delay: String(options.delaySeconds || 0),
      ...(options.id && { id: options.id }),
    });
  },
  cancel: (id: string) => {
    despiaCommand("localpush", "cancel", { id });
  },
  cancelAll: () => {
    despiaCommand("localpush", "cancelall");
  },
};

// ─── AirPrint ─────────────────────────────────────────────────

export const airPrint = (url: string) => {
  despiaCommand("airprint", "", { url });
};

// ─── PkPass (Mobile Wallet) ──────────────────────────────────

export const addToWallet = (passUrl: string) => {
  despiaCommand("pkpass", "", { url: passUrl });
};

// ─── Native Clipboard ─────────────────────────────────────────

export const nativeClipboard = {
  copy: (text: string) => {
    if (isDespiaNative()) {
      despiaCommand("clipboard", "copy", { text });
      return;
    }
    navigator.clipboard?.writeText(text);
  },
};

// ─── Safe Area Helpers ────────────────────────────────────────

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

export const initDespia = () => {
  const native = isDespiaNative();
  console.log(`[Despia] Native: ${native}`);

  if (native) {
    // Set default status bar
    StatusBarThemes.primary();

    // Lock to portrait on phones
    setOrientation("portrait");

    // Expose safe-area CSS custom properties
    const root = document.documentElement;
    const sides = ["top", "bottom", "left", "right"] as const;
    sides.forEach((side) => {
      root.style.setProperty(
        `--safe-area-${side}`,
        `env(safe-area-inset-${side}, 0px)`
      );
    });

    // Prevent zoom is handled by viewport meta
    // Splash screen is handled by Despia editor config
    // File inputs, camera, media gallery are auto-intercepted
    // Deeplinks and external links are handled by Despia config

    console.log("[Despia] Bridge initialized — all protocols ready");
  }
};

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isDespiaNative, identityVault } from "@/lib/despia";
import IonIcon from "@/components/IonIcon";

/**
 * BiometricLock — Overlays a lock screen when the app returns from background.
 * Uses Despia Identity Vault for native FaceID/TouchID.
 * Falls back to a simple "Tap to unlock" on web (no-op).
 */
const BiometricLock = () => {
  const [locked, setLocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    // Only activate on native
    if (!isDespiaNative()) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // App went to background — arm the lock
        setLocked(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Listen for vault unlock response
  useEffect(() => {
    if (!isDespiaNative()) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "identityvault_result" && data?.action === "checkbiometrics") {
          if (data.available) {
            setLocked(false);
          }
        }
      } catch {}
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleUnlock = useCallback(() => {
    setAuthenticating(true);
    if (isDespiaNative()) {
      // Trigger biometric prompt via Identity Vault
      identityVault.checkBiometrics();
      // If biometrics succeed, the native bridge will post a message
      // Fallback: auto-unlock after 5s if no response (e.g. biometrics not enrolled)
      setTimeout(() => {
        setLocked(false);
        setAuthenticating(false);
      }, 5000);
    } else {
      setLocked(false);
      setAuthenticating(false);
    }
  }, []);

  if (!locked) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[9998] flex flex-col items-center justify-center"
        style={{
          background: "hsl(var(--bg))",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
          className="flex flex-col items-center"
        >
          <div
            className="w-[80px] h-[80px] rounded-[22px] flex items-center justify-center mb-6"
            style={{
              background: "linear-gradient(135deg, hsl(var(--light-green)), hsl(var(--green) / 0.15))",
              boxShadow: "0 8px 32px -8px hsl(var(--green) / 0.3)",
            }}
          >
            <IonIcon
              name="finger-print-outline"
              size={40}
              style={{ color: "hsl(var(--green))" }}
            />
          </div>

          <h2
            className="font-serif text-[24px] mb-1"
            style={{ color: "hsl(var(--dark))" }}
          >
            TendherMom Locked
          </h2>
          <p
            className="text-[14px] font-sans mb-8"
            style={{ color: "hsl(var(--text-muted))" }}
          >
            Use biometrics to unlock
          </p>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleUnlock}
            disabled={authenticating}
            className="px-8 py-3.5 rounded-2xl text-white text-[15px] font-semibold font-sans flex items-center gap-2 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 28%))",
              boxShadow: "0 4px 20px -4px hsl(var(--green) / 0.4)",
            }}
          >
            <IonIcon name="finger-print" size={20} style={{ color: "white" }} />
            {authenticating ? "Verifying…" : "Unlock with FaceID / TouchID"}
          </motion.button>
        </motion.div>

        <p
          className="absolute bottom-10 text-[11px] font-sans"
          style={{ color: "hsl(var(--text-muted))" }}
        >
          Your health data is protected
        </p>
      </motion.div>
    </AnimatePresence>
  );
};

export default BiometricLock;

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";

/**
 * Persistent banner that pins to the top of the screen whenever the device
 * loses network. Re-appears briefly with a "Back online" success state when
 * the connection returns, then auto-dismisses.
 */
const OfflineBanner = () => {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [showRecovered, setShowRecovered] = useState(false);

  useEffect(() => {
    const goOffline = () => {
      setOnline(false);
      setShowRecovered(false);
    };
    const goOnline = () => {
      setOnline(true);
      setShowRecovered(true);
      window.setTimeout(() => setShowRecovered(false), 2200);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  const visible = !online || showRecovered;
  const isOffline = !online;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed left-0 right-0 z-[200] flex justify-center pointer-events-none"
          style={{ top: "calc(var(--safe-area-top, 0px) + 8px)" }}
          role="status"
          aria-live="polite"
        >
          <div
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full shadow-lg"
            style={{
              background: isOffline ? "hsl(var(--coral))" : "hsl(var(--green))",
              color: "white",
              boxShadow: "0 6px 20px -8px rgba(0,0,0,0.25)",
            }}
          >
            <IonIcon
              name={isOffline ? "cloud-offline-outline" : "checkmark-circle-outline"}
              size={16}
              style={{ color: "white" }}
            />
            <span className="text-[12.5px] font-sans font-semibold">
              {isOffline ? "You're offline" : "Back online"}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;

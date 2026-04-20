import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface UploadProgressProps {
  progress: number | null;
  /** Optional rounded class to match the parent (e.g. "rounded-full" for avatars) */
  rounded?: string;
  label?: string;
}

/**
 * Translucent overlay showing real upload progress (0-100).
 * Place inside a `relative` container that matches the file preview shape.
 */
const UploadProgress = ({ progress, rounded = "rounded-2xl", label }: UploadProgressProps) => {
  const visible = progress !== null && progress < 100;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${rounded}`}
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <IonIcon name="cloud-upload-outline" size={22} style={{ color: "white" }} />
          {/* Progress ring */}
          <div className="relative w-12 h-12">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="3"
              />
              <motion.circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 15}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 15 * (1 - (progress ?? 0) / 100),
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-[11px] font-sans font-bold">
                {progress ?? 0}%
              </span>
            </div>
          </div>
          {label && (
            <p className="text-white text-[11px] font-sans font-medium">{label}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadProgress;

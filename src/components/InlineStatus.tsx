import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";

export type InlineStatusKind = "error" | "success" | "info" | "warning";

export interface InlineStatusMsg {
  kind: InlineStatusKind;
  text: string;
}

interface InlineStatusProps {
  status: InlineStatusMsg | null;
  className?: string;
  /** Tailwind margin override, defaults to mb-3 */
  spacing?: string;
}

const STYLES: Record<InlineStatusKind, { bg: string; fg: string; icon: string }> = {
  error: {
    bg: "hsl(var(--light-coral))",
    fg: "hsl(var(--coral))",
    icon: "alert-circle-outline",
  },
  success: {
    bg: "hsl(var(--light-green))",
    fg: "hsl(var(--green))",
    icon: "checkmark-circle-outline",
  },
  info: {
    bg: "hsl(var(--surface))",
    fg: "hsl(var(--dark))",
    icon: "information-circle-outline",
  },
  warning: {
    bg: "hsl(45 93% 92%)",
    fg: "hsl(45 93% 35%)",
    icon: "warning-outline",
  },
};

/**
 * Inline status banner for error/success/info/warning.
 * Drop in next to the action button to give users immediate, in-context feedback
 * without using popup toasts.
 */
const InlineStatus = ({ status, className, spacing = "mb-3" }: InlineStatusProps) => {
  return (
    <AnimatePresence>
      {status && (
        <motion.div
          key={`${status.kind}-${status.text}`}
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.18 }}
          className={`overflow-hidden ${spacing} ${className ?? ""}`}
        >
          <div
            className="flex items-start gap-2 px-3.5 py-2.5 rounded-2xl"
            style={{ background: STYLES[status.kind].bg }}
          >
            <IonIcon
              name={STYLES[status.kind].icon}
              size={16}
              style={{ color: STYLES[status.kind].fg, marginTop: 1, flexShrink: 0 }}
            />
            <p
              className="text-[12.5px] font-sans font-medium leading-snug flex-1"
              style={{ color: STYLES[status.kind].fg }}
            >
              {status.text}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InlineStatus;

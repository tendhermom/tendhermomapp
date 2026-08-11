import { motion } from "framer-motion";
import type { ReactNode } from "react";
import IonIcon from "@/components/IonIcon";

interface ScreenHeaderProps {
  /** Small uppercase eyebrow above the title */
  eyebrow?: string;
  title: string;
  onBack?: () => void;
  /** Right-side action buttons */
  actions?: ReactNode;
}

/**
 * Premium editorial screen header: tinted glass back control,
 * caps eyebrow, serif title and a soft fading hairline.
 */
const ScreenHeader = ({ eyebrow, title, onBack, actions }: ScreenHeaderProps) => (
  <div className="pt-4 pb-1">
    <div className="flex items-start gap-3">
      {onBack && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          onClick={onBack}
          aria-label="Go back"
          className="w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: "hsl(var(--light-green))",
            boxShadow: "inset 0 0 0 1px hsl(var(--green) / 0.10), 0 4px 14px -8px hsl(var(--green) / 0.5)",
          }}
        >
          <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--green))" }} />
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 min-w-0"
      >
        {eyebrow && (
          <p
            className="text-[9.5px] font-sans font-semibold uppercase mb-0.5"
            style={{ letterSpacing: "0.18em", color: "hsl(var(--green) / 0.7)" }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="font-serif text-[24px] leading-[1.15] tracking-[-0.01em]"
          style={{ color: "hsl(var(--dark))" }}
        >
          {title}
        </h1>
      </motion.div>

      {actions && <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">{actions}</div>}
    </div>

    <div
      className="mt-4 h-px w-full"
      style={{
        background:
          "linear-gradient(to right, hsl(var(--green) / 0.22), hsl(var(--green) / 0.06) 55%, transparent)",
      }}
    />
  </div>
);

export default ScreenHeader;

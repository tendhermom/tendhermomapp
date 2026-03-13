import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface HealthTipChipProps {
  tip: string;
  onViewRecord?: () => void;
}

const HealthTipChip = ({ tip, onViewRecord }: HealthTipChipProps) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3"
      style={{ background: "hsla(140, 24%, 55%, 0.12)" }}
    >
      <p className="ios-footnote text-foreground font-medium flex-1">{tip}</p>
      {onViewRecord && (
        <button
          onClick={onViewRecord}
          className="flex items-center gap-1 flex-shrink-0 ios-press"
        >
          <span className="ios-caption font-semibold" style={{ color: "hsl(var(--forest))" }}>
            View
          </span>
          <IonIcon name="chevron-forward" size={14} style={{ color: "hsl(var(--forest))" }} />
        </button>
      )}
    </motion.div>
  );
};

export default HealthTipChip;

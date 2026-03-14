import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface HealthTipChipProps {
  icon: string;
  tip: string;
  onViewRecord?: () => void;
}

const HealthTipChip = ({ icon, tip, onViewRecord }: HealthTipChipProps) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="rounded-[20px] px-4 py-[14px] flex items-center justify-between gap-3"
      style={{ background: "hsl(var(--light-green))" }}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <IonIcon name={icon} size={18} style={{ color: "hsl(var(--green))" }} />
        <p className="text-dark text-[14px] font-medium font-sans truncate">{tip}</p>
      </div>
      {onViewRecord && (
        <button
          onClick={onViewRecord}
          className="flex items-center gap-0.5 flex-shrink-0 ios-press"
        >
          <span className="text-[12px] font-semibold font-sans" style={{ color: "hsl(var(--green))" }}>
            View
          </span>
          <IonIcon name="chevron-forward" size={14} style={{ color: "hsl(var(--green))" }} />
        </button>
      )}
    </motion.div>
  );
};

export default HealthTipChip;
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface HealthTipChipProps {
  tip: string;
  onViewRecord?: () => void;
}

const HealthTipChip = ({ tip, onViewRecord }: HealthTipChipProps) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="bg-secondary/20 rounded-[20px] px-4 py-3 flex items-center justify-between gap-3"
    >
      <p className="text-sm text-foreground font-medium flex-1">{tip}</p>
      {onViewRecord && (
        <button
          onClick={onViewRecord}
          className="text-xs text-primary font-medium flex items-center gap-1 flex-shrink-0"
        >
          Full record
          <ArrowRight size={12} />
        </button>
      )}
    </motion.div>
  );
};

export default HealthTipChip;

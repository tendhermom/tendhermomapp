import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface PremiumUpsellProps {
  title: string;
  description: string;
  ctaText?: string;
  onAction?: () => void;
}

const PremiumUpsell = ({
  title,
  description,
  ctaText = "Upgrade Now",
  onAction,
}: PremiumUpsellProps) => {
  return (
    <motion.div
      whileTap={{ y: -2 }}
      className="bg-card rounded-xl card-shadow p-5 relative overflow-hidden"
    >
      <span className="absolute top-3 right-3 text-[10px] font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
        <Sparkles size={10} />
        PREMIUM
      </span>
      <h4 className="text-base font-semibold text-foreground pr-20">{title}</h4>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAction}
        className="mt-3 bg-accent text-accent-foreground text-sm font-medium px-5 py-2.5 rounded-lg"
      >
        {ctaText}
      </motion.button>
    </motion.div>
  );
};

export default PremiumUpsell;

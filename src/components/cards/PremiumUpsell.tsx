import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

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
      whileTap={{ scale: 0.98 }}
      className="tend-card p-[20px] relative overflow-hidden"
    >
      {/* Decorative */}
      <div
        className="absolute -top-8 -right-8 w-[80px] h-[80px] rounded-full"
        style={{ background: "hsl(var(--light-coral))" }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-dark text-[16px] font-semibold font-sans flex-1">{title}</h4>
          <span
            className="label-caps px-2 py-[3px] rounded-full flex items-center gap-1"
            style={{
              background: "hsl(var(--light-coral))",
              color: "hsl(var(--coral))",
            }}
          >
            <IonIcon name="diamond" size={10} style={{ color: "hsl(var(--coral))" }} />
            Premium
          </span>
        </div>
        <p className="text-text-muted text-[13px] font-sans mt-1">{description}</p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onAction}
          className="mt-4 px-6 py-[12px] rounded-2xl text-[15px] font-bold font-sans"
          style={{
            background: "hsl(var(--coral))",
            color: "white",
          }}
        >
          {ctaText}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default PremiumUpsell;
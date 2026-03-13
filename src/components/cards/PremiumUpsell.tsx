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
      className="ios-card-elevated p-5 relative overflow-hidden"
    >
      {/* Decorative gradient blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10"
        style={{ background: "hsl(var(--coral))" }}
      />

      <div className="flex items-start gap-1 mb-1">
        <h4 className="ios-title text-foreground flex-1">{title}</h4>
        <span
          className="ios-caption font-bold px-2 py-[2px] rounded-full flex items-center gap-1"
          style={{
            background: "hsla(11, 74%, 63%, 0.1)",
            color: "hsl(var(--coral))",
          }}
        >
          <IonIcon name="diamond" size={10} style={{ color: "hsl(var(--coral))" }} />
          PRO
        </span>
      </div>
      <p className="ios-footnote text-muted-foreground mt-1">{description}</p>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onAction}
        className="mt-4 px-6 py-[11px] rounded-xl ios-body font-semibold"
        style={{
          background: "hsl(var(--coral))",
          color: "white",
        }}
      >
        {ctaText}
      </motion.button>
    </motion.div>
  );
};

export default PremiumUpsell;

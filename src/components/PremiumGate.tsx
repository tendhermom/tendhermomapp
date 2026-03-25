import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface PremiumGateProps {
  feature: string;
  description?: string;
  onUpgrade: () => void;
}

const PremiumGate = ({ feature, description, onUpgrade }: PremiumGateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-10 px-6 text-center"
  >
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
      style={{ background: "linear-gradient(135deg, hsl(var(--light-coral)), hsl(var(--light-green)))" }}
    >
      <IonIcon name="lock-closed" size={28} style={{ color: "hsl(var(--coral))" }} />
    </div>
    <h3 className="text-[18px] font-serif mb-1" style={{ color: "hsl(var(--dark))" }}>
      Premium Feature
    </h3>
    <p className="text-[13px] font-sans mb-1" style={{ color: "hsl(var(--text-muted))" }}>
      <span className="font-semibold" style={{ color: "hsl(var(--green))" }}>{feature}</span> is available for Premium members.
    </p>
    {description && (
      <p className="text-[11px] font-sans max-w-[260px] mb-5" style={{ color: "hsl(var(--text-muted))" }}>
        {description}
      </p>
    )}
    {!description && <div className="mb-5" />}
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onUpgrade}
      className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-sans font-semibold ios-press"
      style={{
        background: "linear-gradient(135deg, hsl(var(--green)), hsl(var(--green-dark)))",
        color: "white",
        boxShadow: "0 4px 14px hsla(var(--green), 0.3)",
      }}
    >
      <IonIcon name="diamond-outline" size={16} style={{ color: "white" }} />
      Upgrade to Premium
    </motion.button>
  </motion.div>
);

export default PremiumGate;

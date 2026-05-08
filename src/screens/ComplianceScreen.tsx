import IonIcon from "@/components/IonIcon";
import { motion } from "framer-motion";

interface ComplianceScreenProps {
  onBack: () => void;
}

const ComplianceScreen = ({ onBack }: ComplianceScreenProps) => {
  return (
    <div className="space-y-5 pb-6 pt-1">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "hsl(var(--surface))" }}
        >
          <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>
          Compliance
        </h1>
      </div>

      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="tend-card p-4"
      >
        <p className="text-[13px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
          TendherMom is built to support — not replace — professional medical care.
          Please review the disclaimer below before relying on any in-app guidance.
        </p>
      </motion.div>

      {/* Disclaimer card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.06 }}
        className="rounded-[14px] p-4 flex items-start gap-2.5"
        style={{ background: "hsl(var(--light-coral))" }}
      >
        <IonIcon
          name="shield-checkmark-outline"
          size={14}
          style={{ color: "hsl(var(--coral))", marginTop: 2, flexShrink: 0 }}
        />
        <p className="text-[10px] font-sans leading-[1.6]" style={{ color: "hsl(var(--text-muted))" }}>
          <span className="font-semibold" style={{ color: "hsl(var(--dark))" }}>Disclaimer: </span>
          TendherMom is not a medical device. Information provided by TENDHERMOM LTD, including AI Chat and Symptom
          Triage, is for educational purposes only and does not replace professional medical advice, diagnosis, or
          treatment. In a medical emergency, contact a doctor or visit the nearest hospital immediately. Use of the
          SOS feature does not guarantee an emergency response.
        </p>
      </motion.div>

      <p className="text-center text-[10px] font-sans pt-2" style={{ color: "hsl(var(--text-muted))" }}>
        © {new Date().getFullYear()} TENDHERMOM LTD
      </p>
    </div>
  );
};

export default ComplianceScreen;

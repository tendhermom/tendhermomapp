import IonIcon from "@/components/IonIcon";
import { motion } from "framer-motion";

interface TriageScreenProps {
  onNavigate: (screen: string) => void;
}

const TriageScreen = ({ onNavigate }: TriageScreenProps) => {
  return (
    <motion.div
      className="space-y-6 pb-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <h1 className="font-serif text-dark text-[26px]">Symptom Triage</h1>
      <p className="text-[14px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
        Answer a few quick questions to understand your symptoms and get guidance.
      </p>

      <div className="tend-card p-8 flex flex-col items-center gap-4 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "hsl(var(--green) / 0.12)" }}
        >
          <IonIcon name="medkit" size={32} style={{ color: "hsl(var(--green))" }} />
        </div>
        <h2 className="font-serif text-dark text-[18px]">Coming Soon</h2>
        <p className="text-[13px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
          Clinical triage pathways will help you assess symptoms and decide when to seek care.
        </p>
      </div>
    </motion.div>
  );
};

export default TriageScreen;

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface HealthSafetyProps {
  onBack?: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const HealthSafety = ({ onBack }: HealthSafetyProps = {}) => {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <div className="min-h-screen flex justify-center" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-[430px]" style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 12px)" }}>
        <motion.div
          className="px-5 pb-10"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          <motion.button
            variants={fadeUp}
            whileTap={{ scale: 0.92 }}
            onClick={handleBack}
            className="flex items-center gap-1.5 mb-6"
          >
            <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--green))" }} />
            <span className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--green))" }}>Back</span>
          </motion.button>

          <motion.div
            variants={fadeUp}
            className="rounded-[20px] p-6 mb-6"
            style={{
              background: "linear-gradient(145deg, hsl(153 42% 22%), hsl(153 42% 32%))",
              boxShadow: "0 12px 40px -8px hsla(153, 42%, 22%, 0.45)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)" }}>
                <IonIcon name="medkit" size={22} style={{ color: "hsl(var(--coral))" }} />
              </div>
            </div>
            <h1 className="text-white font-serif text-[26px] leading-tight tracking-[-0.01em]">Health & Safety</h1>
            <p className="text-white/60 text-[12px] font-sans mt-2">Medical Disclaimer</p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="tend-card overflow-hidden"
            style={{ borderLeft: "3px solid hsl(var(--coral))" }}
          >
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--light-coral))" }}>
                <IonIcon name="warning-outline" size={18} style={{ color: "hsl(var(--coral))" }} />
              </div>
              <h2 className="text-[15px] font-sans font-bold" style={{ color: "hsl(var(--dark))" }}>
                Disclaimer
              </h2>
            </div>
            <div className="px-5 pb-5">
              <p className="text-[13px] font-sans leading-[1.75]" style={{ color: "hsl(var(--dark))" }}>
                TendherMom is not a medical device. The information provided by TENDHERMOM LTD, including AI Chat and
                Symptom Triage, is for educational purposes only and does not replace professional medical advice,
                diagnosis, or treatment.
              </p>
              <p className="text-[13px] font-sans leading-[1.75] mt-3" style={{ color: "hsl(var(--text-muted))" }}>
                In case of a medical emergency, contact a doctor or visit the nearest hospital immediately. Use of the
                SOS feature does not guarantee an emergency response.
              </p>
            </div>
          </motion.div>

          <motion.p variants={fadeUp} className="text-center text-[11px] font-sans mt-6" style={{ color: "hsl(var(--text-muted))" }}>
            © {new Date().getFullYear()} TENDHERMOM LTD. All rights reserved.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default HealthSafety;

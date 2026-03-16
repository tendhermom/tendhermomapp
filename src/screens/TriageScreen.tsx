import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import PATHWAYS, { type TriagePathway, type TriageOutcome, type Severity } from "@/data/triagePathways";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";

interface TriageScreenProps {
  onNavigate: (screen: string) => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const SEVERITY_CONFIG: Record<Severity, { bg: string; color: string; icon: string; glow: string }> = {
  green: {
    bg: "linear-gradient(135deg, hsl(153 42% 94%), hsl(153 42% 88%))",
    color: "hsl(var(--green))",
    icon: "checkmark-circle",
    glow: "0 8px 32px -8px hsla(153,42%,30%,0.3)",
  },
  yellow: {
    bg: "linear-gradient(135deg, hsl(38 92% 95%), hsl(38 92% 88%))",
    color: "hsl(38, 92%, 45%)",
    icon: "alert-circle",
    glow: "0 8px 32px -8px hsla(38,92%,45%,0.3)",
  },
  red: {
    bg: "linear-gradient(135deg, hsl(11 74% 95%), hsl(11 74% 88%))",
    color: "hsl(var(--coral))",
    icon: "warning",
    glow: "0 8px 32px -8px hsla(11,74%,63%,0.3)",
  },
};

const TriageScreen = ({ onNavigate }: TriageScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const [selectedPathway, setSelectedPathway] = useState<TriagePathway | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<TriageOutcome | null>(null);
  const [saving, setSaving] = useState(false);

  const currentQuestion = selectedPathway?.questions.find((q) => q.id === currentQuestionId) || null;
  const questionIndex = selectedPathway?.questions.findIndex((q) => q.id === currentQuestionId) ?? -1;
  const totalQuestions = selectedPathway?.questions.length ?? 0;

  const startPathway = useCallback((pathway: TriagePathway) => {
    setSelectedPathway(pathway);
    setCurrentQuestionId(pathway.questions[0].id);
    setAnswers([]);
    setOutcome(null);
  }, []);

  const handleAnswer = useCallback(async (optionLabel: string, next?: string, optionOutcome?: TriageOutcome) => {
    const newAnswers = [...answers, optionLabel];
    setAnswers(newAnswers);

    if (optionOutcome) {
      setOutcome(optionOutcome);
      setCurrentQuestionId(null);

      // Save session
      if (user && selectedPathway) {
        setSaving(true);
        await supabase.from("triage_sessions").insert([{
          user_id: user.id,
          pathway: selectedPathway.id,
          answers: JSON.parse(JSON.stringify(newAnswers)),
          outcome: optionOutcome.title,
          severity: optionOutcome.severity,
          recommendation: optionOutcome.action,
        }]);
        setSaving(false);
      }
    } else if (next) {
      setCurrentQuestionId(next);
    }
  }, [answers, user, selectedPathway]);

  const reset = useCallback(() => {
    setSelectedPathway(null);
    setCurrentQuestionId(null);
    setAnswers([]);
    setOutcome(null);
  }, []);

  // Pathway selection screen
  if (!selectedPathway) {
    return (
      <motion.div
        className="space-y-6 pb-4"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      >
        <motion.div variants={fadeUp}>
          <h1 className="font-serif text-[26px]" style={{ color: "hsl(var(--dark))" }}>Symptom Triage</h1>
          <p className="text-[13px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
            Select what you're feeling. We'll guide you in under 2 minutes.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {PATHWAYS.map((pathway) => (
            <motion.button
              key={pathway.id}
              variants={fadeUp}
              whileTap={{ scale: 0.96 }}
              onClick={() => startPathway(pathway)}
              className="rounded-[18px] p-4 text-left ios-press flex flex-col gap-3"
              style={{
                background: "hsl(var(--surface))",
                boxShadow: "0 1px 3px hsla(0,0%,0%,0.04), 0 4px 16px -2px hsla(0,0%,0%,0.06)",
              }}
            >
              <div
                className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(153 42% 94%), hsl(153 42% 88%))" }}
              >
                <IonIcon name={pathway.icon} size={22} style={{ color: "hsl(var(--green))" }} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>{pathway.name}</h3>
                <p className="text-[11px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>{pathway.description}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Medical disclaimer */}
        <motion.div variants={fadeUp} className="flex items-start gap-2.5 pt-2">
          <IonIcon name="shield-checkmark" size={16} style={{ color: "hsl(var(--green))" }} />
          <p className="text-[11px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
            Reviewed by Dr. Adaeze Nwosu, FWACS · LUTH. This tool does not replace professional medical advice.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  // Outcome screen
  if (outcome) {
    const config = SEVERITY_CONFIG[outcome.severity];
    return (
      <motion.div
        className="space-y-6 pb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Back */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={reset} className="ios-press flex items-center gap-1.5">
          <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--dark))" }} />
          <span className="text-[14px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>Start over</span>
        </motion.button>

        {/* Result card */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
          className="rounded-[22px] p-6 text-center"
          style={{ background: config.bg, boxShadow: config.glow }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 20 }}
            className="w-[64px] h-[64px] rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "white", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
          >
            <IonIcon name={config.icon} size={34} style={{ color: config.color }} />
          </motion.div>
          <h2 className="font-serif text-[22px] mb-2" style={{ color: config.color }}>{outcome.title}</h2>
          <p className="text-[14px] font-sans leading-relaxed mb-4" style={{ color: "hsl(var(--dark))" }}>
            {outcome.message}
          </p>
          <div
            className="rounded-[14px] p-4 text-left"
            style={{ background: "rgba(255,255,255,0.7)" }}
          >
            <p className="text-[11px] font-sans font-semibold uppercase tracking-wide mb-1.5" style={{ color: config.color }}>
              What to do
            </p>
            <p className="text-[13px] font-sans leading-relaxed" style={{ color: "hsl(var(--dark))" }}>
              {outcome.action}
            </p>
          </div>
        </motion.div>

        {/* SOS shortcut for red outcomes */}
        {outcome.severity === "red" && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate("sos")}
            className="w-full rounded-[18px] p-4 flex items-center gap-3 ios-press"
            style={{
              background: "hsl(var(--coral))",
              boxShadow: "0 6px 24px -4px hsla(11,74%,63%,0.45)",
            }}
          >
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <IonIcon name="pulse" size={22} style={{ color: "white" }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-bold font-sans text-white">Alert your emergency contacts</p>
              <p className="text-[12px] font-sans text-white/70">Tap to send SOS via SMS, WhatsApp & call</p>
            </div>
            <IonIcon name="chevron-forward" size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
          </motion.button>
        )}

        {/* Actions */}
        <div className="space-y-2.5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={reset}
            className="w-full py-[14px] rounded-[16px] text-[15px] font-semibold font-sans ios-press"
            style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", boxShadow: "0 1px 3px hsla(0,0%,0%,0.04), 0 4px 16px -2px hsla(0,0%,0%,0.06)" }}
          >
            Check another symptom
          </motion.button>
        </div>

        <div className="flex items-start gap-2.5">
          <IonIcon name="shield-checkmark" size={14} style={{ color: "hsl(var(--green))" }} />
          <p className="text-[10px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
            This is guidance only and does not replace professional medical advice.
          </p>
        </div>
      </motion.div>
    );
  }

  // Question flow
  return (
    <motion.div
      className="space-y-6 pb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.88 }} onClick={reset} className="ios-press">
          <IonIcon name="chevron-back" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <div className="flex-1">
          <h1 className="font-serif text-[20px]" style={{ color: "hsl(var(--dark))" }}>{selectedPathway.name}</h1>
        </div>
        <span className="text-[12px] font-sans font-medium px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--surface))", color: "hsl(var(--text-muted))" }}>
          Q{questionIndex + 1}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "hsl(var(--green))" }}
          initial={{ width: 0 }}
          animate={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-4"
          >
            <h2 className="font-serif text-[20px] leading-snug" style={{ color: "hsl(var(--dark))" }}>
              {currentQuestion.text}
            </h2>

            <div className="space-y-2.5">
              {currentQuestion.options.map((option, i) => (
                <motion.button
                  key={option.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.06, type: "spring", stiffness: 300, damping: 30 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(option.label, option.next, option.outcome)}
                  className="w-full rounded-[16px] p-4 text-left ios-press flex items-center gap-3"
                  style={{
                    background: "hsl(var(--surface))",
                    boxShadow: "0 1px 3px hsla(0,0%,0%,0.04), 0 4px 16px -2px hsla(0,0%,0%,0.06)",
                  }}
                >
                  <div
                    className="w-[8px] h-[8px] rounded-full flex-shrink-0"
                    style={{ background: "hsl(var(--border))" }}
                  />
                  <span className="text-[14px] font-sans" style={{ color: "hsl(var(--dark))" }}>
                    {option.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TriageScreen;

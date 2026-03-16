import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import PATHWAYS, { CATEGORIES, type TriagePathway, type TriageOutcome, type Severity } from "@/data/triagePathways";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";

interface TriageScreenProps {
  onNavigate: (screen: string) => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const SEVERITY_CONFIG: Record<Severity, { bg: string; color: string; icon: string; glow: string; label: string }> = {
  green: {
    bg: "linear-gradient(135deg, hsl(153 42% 94%), hsl(153 42% 86%))",
    color: "hsl(var(--green))",
    icon: "checkmark-circle",
    glow: "0 8px 32px -8px hsla(153,42%,30%,0.3)",
    label: "You are likely safe",
  },
  yellow: {
    bg: "linear-gradient(135deg, hsl(38 92% 95%), hsl(38 82% 86%))",
    color: "hsl(38, 82%, 42%)",
    icon: "alert-circle",
    glow: "0 8px 32px -8px hsla(38,82%,42%,0.3)",
    label: "You need attention today",
  },
  red: {
    bg: "linear-gradient(135deg, hsl(0 74% 95%), hsl(0 74% 88%))",
    color: "hsl(0, 72%, 50%)",
    icon: "warning",
    glow: "0 8px 32px -8px hsla(0,72%,50%,0.35)",
    label: "Go to hospital NOW",
  },
};

const TriageScreen = ({ onNavigate }: TriageScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const [selectedPathway, setSelectedPathway] = useState<TriagePathway | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<TriageOutcome | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const currentQuestion = selectedPathway?.questions.find((q) => q.id === currentQuestionId) || null;
  const questionIndex = selectedPathway?.questions.findIndex((q) => q.id === currentQuestionId) ?? -1;
  const totalQuestions = selectedPathway?.questions.length ?? 0;

  // Group pathways by category
  const groupedPathways = useMemo(() => {
    const groups: Record<string, TriagePathway[]> = {};
    PATHWAYS.forEach((p) => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, []);

  const activeCategories = useMemo(
    () => CATEGORIES.filter((c) => groupedPathways[c.id]?.length),
    [groupedPathways]
  );

  const filteredPathways = useMemo(
    () => (selectedCategory ? groupedPathways[selectedCategory] || [] : PATHWAYS),
    [selectedCategory, groupedPathways]
  );

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

  // ========================
  // PATHWAY SELECTION SCREEN
  // ========================
  if (!selectedPathway) {
    return (
      <motion.div
        className="space-y-5 pb-4 pt-1"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        {/* Header — Apple large-title style */}
        <motion.div variants={fadeUp} className="pt-1">
          <h1 className="font-serif text-[30px] leading-tight tracking-[-0.01em]" style={{ color: "hsl(var(--dark))" }}>
            Symptom Triage
          </h1>
          <p className="text-[13px] font-sans mt-1.5 leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
            Select what you're feeling. We'll guide you in under 2&nbsp;minutes.
          </p>
        </motion.div>

        {/* Category filter chips */}
        <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(null)}
            className="flex-shrink-0 px-3.5 py-[7px] rounded-full text-[11px] font-sans font-semibold ios-press transition-colors"
            style={{
              background: !selectedCategory ? "hsl(var(--green))" : "hsl(var(--surface))",
              color: !selectedCategory ? "white" : "hsl(var(--text-muted))",
              boxShadow: !selectedCategory ? "0 4px 12px -2px hsla(153,42%,30%,0.3)" : "0 1px 3px hsla(0,0%,0%,0.04)",
            }}
          >
            All
          </motion.button>
          {activeCategories.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className="flex-shrink-0 px-3.5 py-[7px] rounded-full text-[11px] font-sans font-semibold ios-press flex items-center gap-1.5 transition-colors"
              style={{
                background: selectedCategory === cat.id ? "hsl(var(--green))" : "hsl(var(--surface))",
                color: selectedCategory === cat.id ? "white" : "hsl(var(--text-muted))",
                boxShadow: selectedCategory === cat.id ? "0 4px 12px -2px hsla(153,42%,30%,0.3)" : "0 1px 3px hsla(0,0%,0%,0.04)",
              }}
            >
              <IonIcon name={cat.icon} size={13} style={{ color: selectedCategory === cat.id ? "white" : "hsl(var(--text-muted))" }} />
              {cat.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Pathways count */}
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <p className="label-caps text-text-muted">
            {selectedCategory
              ? activeCategories.find((c) => c.id === selectedCategory)?.label?.toUpperCase()
              : "ALL SYMPTOMS"}
          </p>
          <span className="text-[10px] font-sans font-semibold tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>
            {filteredPathways.length} pathways
          </span>
        </motion.div>

        {/* Pathway cards — unified container */}
        <motion.div
          variants={fadeUp}
          className="rounded-[20px] overflow-hidden"
          style={{
            background: "hsl(var(--surface))",
            boxShadow: "0 2px 16px -4px hsla(0,0%,0%,0.08)",
          }}
        >
          {filteredPathways.map((pathway, i) => {
            const isLast = i === filteredPathways.length - 1;
            const isGreen = i % 2 === 0;
            return (
              <div key={pathway.id}>
                <motion.button
                  variants={fadeUp}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startPathway(pathway)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left ios-press"
                >
                  <div
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isGreen
                        ? "linear-gradient(135deg, hsl(var(--light-green)), hsl(144 28% 89%))"
                        : "linear-gradient(135deg, hsl(var(--light-coral)), hsl(14 82% 92%))",
                      boxShadow: isGreen
                        ? "0 2px 8px -2px hsla(153,42%,30%,0.2)"
                        : "0 2px 8px -2px hsla(11,74%,63%,0.2)",
                    }}
                  >
                    <IonIcon
                      name={pathway.icon}
                      size={18}
                      style={{ color: isGreen ? "hsl(var(--green))" : "hsl(var(--coral))" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
                      {pathway.name}
                    </h3>
                    <p className="text-[10px] font-sans mt-0.5 truncate" style={{ color: "hsl(var(--text-muted))" }}>
                      {pathway.description}
                    </p>
                  </div>
                  <IonIcon name="chevron-forward" size={14} style={{ color: "hsl(var(--text-muted))" }} />
                </motion.button>
                {!isLast && (
                  <div className="mx-4 h-px" style={{ background: "hsl(var(--border-subtle))" }} />
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Medical disclaimer */}
        <motion.div variants={fadeUp} className="flex items-start gap-2.5 pt-1">
          <IonIcon name="shield-checkmark" size={14} style={{ color: "hsl(var(--green))" }} />
          <p className="text-[10px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
            Reviewed by Dr. Adaeze Nwosu, FWACS · LUTH. Adapted from NHS 111 protocols with Nigerian clinical context. This tool does not replace professional medical advice.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  // ========================
  // OUTCOME SCREEN
  // ========================
  if (outcome) {
    const config = SEVERITY_CONFIG[outcome.severity];
    return (
      <motion.div
        className="space-y-5 pb-4"
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
          className="rounded-[22px] p-6 relative overflow-hidden"
          style={{ background: config.bg, boxShadow: config.glow }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-[120px] h-[120px] rounded-full" style={{ background: `radial-gradient(circle, ${config.color}10 0%, transparent 70%)` }} />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 20 }}
            className="w-[60px] h-[60px] rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "white", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
          >
            <IonIcon name={config.icon} size={32} style={{ color: config.color }} />
          </motion.div>

          <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-center mb-1" style={{ color: config.color }}>
            {config.label}
          </p>
          <h2 className="font-serif text-[22px] text-center mb-2" style={{ color: "hsl(var(--dark))" }}>{outcome.title}</h2>
          <p className="text-[13px] font-sans leading-relaxed text-center mb-4" style={{ color: "hsl(var(--dark))", opacity: 0.8 }}>
            {outcome.message}
          </p>

          <div
            className="rounded-[14px] p-4 text-left"
            style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <IonIcon name="arrow-forward-circle" size={16} style={{ color: config.color }} />
              <p className="text-[11px] font-sans font-bold uppercase tracking-wide" style={{ color: config.color }}>
                What to do
              </p>
            </div>
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
            className="w-full rounded-[18px] p-4 flex items-center gap-3 ios-press relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(0 72% 50%), hsl(0 72% 42%))",
              boxShadow: "0 6px 24px -4px hsla(0,72%,50%,0.45)",
            }}
          >
            <div className="absolute -top-10 -right-10 w-[80px] h-[80px] rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <IonIcon name="pulse" size={22} style={{ color: "white" }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[14px] font-bold font-sans text-white">Alert your emergency contacts</p>
              <p className="text-[11px] font-sans text-white/70">Tap to send SOS via SMS, WhatsApp & call</p>
            </div>
            <IonIcon name="chevron-forward" size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
          </motion.button>
        )}

        {/* Actions */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={reset}
          className="w-full py-[14px] rounded-[16px] text-[14px] font-semibold font-sans ios-press"
          style={{
            background: "hsl(var(--surface))",
            color: "hsl(var(--dark))",
            boxShadow: "0 2px 12px -2px hsla(0,0%,0%,0.06)",
          }}
        >
          Check another symptom
        </motion.button>

        <div className="flex items-start gap-2.5">
          <IonIcon name="shield-checkmark" size={14} style={{ color: "hsl(var(--green))" }} />
          <p className="text-[10px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
            This is guidance only and does not replace professional medical advice. Reviewed by Dr. Adaeze Nwosu, FWACS.
          </p>
        </div>
      </motion.div>
    );
  }

  // ========================
  // QUESTION FLOW
  // ========================
  return (
    <motion.div
      className="space-y-5 pb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.88 }} onClick={reset} className="ios-press">
          <IonIcon name="chevron-back" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-[20px] truncate" style={{ color: "hsl(var(--dark))" }}>{selectedPathway.name}</h1>
        </div>
        <span
          className="text-[11px] font-sans font-semibold px-3 py-1 rounded-full"
          style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
        >
          Q{questionIndex + 1}/{totalQuestions}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(var(--green)), hsl(153 42% 40%))" }}
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
            <div
              className="rounded-[18px] p-4"
              style={{
                background: "linear-gradient(135deg, hsl(var(--light-green)), hsla(144,28%,93%,0.5))",
              }}
            >
              <h2 className="font-serif text-[19px] leading-snug" style={{ color: "hsl(var(--dark))" }}>
                {currentQuestion.text}
              </h2>
            </div>

            <div className="space-y-2">
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
                    boxShadow: "0 1px 3px hsla(0,0%,0%,0.04), 0 4px 12px -4px hsla(0,0%,0%,0.06)",
                  }}
                >
                  <div
                    className="w-[10px] h-[10px] rounded-full flex-shrink-0 border-2"
                    style={{ borderColor: "hsl(var(--green))", background: "transparent" }}
                  />
                  <span className="text-[13px] font-sans leading-snug" style={{ color: "hsl(var(--dark))" }}>
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

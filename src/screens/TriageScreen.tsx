import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import PATHWAYS, { CATEGORIES, type TriagePathway, type TriageOutcome, type Severity } from "@/data/triagePathways";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";

// Category images
import imgFetal from "@/assets/triage/fetal.jpg";
import imgHaemorrhage from "@/assets/triage/haemorrhage.jpg";
import imgHypertensive from "@/assets/triage/hypertensive.jpg";
import imgAbdominal from "@/assets/triage/abdominal.jpg";
import imgLabour from "@/assets/triage/labour.jpg";
import imgInfection from "@/assets/triage/infection.jpg";
import imgRespiratory from "@/assets/triage/respiratory.jpg";
import imgCardiac from "@/assets/triage/cardiac.jpg";
import imgNeurological from "@/assets/triage/neurological.jpg";
import imgLiver from "@/assets/triage/liver.jpg";
import imgRenal from "@/assets/triage/renal.jpg";
import imgEarlyPregnancy from "@/assets/triage/early_pregnancy.jpg";
import imgSkin from "@/assets/triage/skin.jpg";
import imgMusculoskeletal from "@/assets/triage/musculoskeletal.jpg";
import imgPostpartum from "@/assets/triage/postpartum.jpg";
import imgMentalHealth from "@/assets/triage/mental_health.jpg";

interface TriageScreenProps {
  onNavigate: (screen: string) => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  fetal: imgFetal,
  haemorrhage: imgHaemorrhage,
  hypertensive: imgHypertensive,
  abdominal: imgAbdominal,
  labour: imgLabour,
  infection: imgInfection,
  respiratory: imgRespiratory,
  cardiac: imgCardiac,
  neurological: imgNeurological,
  liver: imgLiver,
  haematological: imgHaemorrhage, // reuse
  renal: imgRenal,
  early_pregnancy: imgEarlyPregnancy,
  skin: imgSkin,
  musculoskeletal: imgMusculoskeletal,
  postpartum: imgPostpartum,
  mental_health: imgMentalHealth,
};

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
    label: "Go to a hospital NOW!",
  },
};

// Universal intake screening question — guarantees every pathway has at least
// one upstream step so users never feel they "jumped" straight to a result.
// Clinically meaningful: duration is always a relevant first-line filter.
const INTAKE_ID = "__intake__";
const INTAKE_QUESTION = {
  id: INTAKE_ID,
  text: "How long have you been experiencing this?",
  // `next` is patched at runtime to point to the pathway's real first question.
  options: [
    { label: "Just started — within the last hour", next: "" },
    { label: "Earlier today", next: "" },
    { label: "1–3 days", next: "" },
    { label: "More than 3 days", next: "" },
  ],
};

const TriageScreen = ({ onNavigate }: TriageScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const [selectedPathway, setSelectedPathway] = useState<TriagePathway | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<TriageOutcome | null>(null);
  const [pendingOutcome, setPendingOutcome] = useState<TriageOutcome | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Build a pathway with the intake question prepended and routed to the original first Q.
  const augmentedPathway = useMemo<TriagePathway | null>(() => {
    if (!selectedPathway) return null;
    const realFirstId = selectedPathway.questions[0].id;
    const intake = {
      ...INTAKE_QUESTION,
      options: INTAKE_QUESTION.options.map((o) => ({ ...o, next: realFirstId })),
    };
    return { ...selectedPathway, questions: [intake, ...selectedPathway.questions] };
  }, [selectedPathway]);

  const currentQuestion = augmentedPathway?.questions.find((q) => q.id === currentQuestionId) || null;
  // Use sequential step count based on answers given, not array index
  const stepNumber = answers.length + 1;
  // Calculate max depth for current path by traversing from current question
  const getMaxDepth = useCallback((qId: string | null, pathway: TriagePathway | null, depth: number): number => {
    if (!qId || !pathway) return depth;
    const q = pathway.questions.find((x) => x.id === qId);
    if (!q) return depth;
    let maxD = depth;
    for (const opt of q.options) {
      if (opt.outcome) {
        maxD = Math.max(maxD, depth);
      } else if (opt.next) {
        maxD = Math.max(maxD, getMaxDepth(opt.next, pathway, depth + 1));
      }
    }
    return maxD;
  }, []);
  const totalStepsEstimate = augmentedPathway
    ? getMaxDepth(augmentedPathway.questions[0].id, augmentedPathway, 1)
    : 1;

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

  const startPathway = useCallback((pathway: TriagePathway) => {
    setSelectedPathway(pathway);
    setCurrentQuestionId(INTAKE_ID);
    setAnswers([]);
    setOutcome(null);
    setPendingOutcome(null);
  }, []);

  const handleAnswer = useCallback(async (optionLabel: string, next?: string, optionOutcome?: TriageOutcome) => {
    const newAnswers = [...answers, optionLabel];
    setAnswers(newAnswers);

    if (optionOutcome) {
      // Show a brief "analysing" transition so the result never feels like an abrupt jump.
      setPendingOutcome(optionOutcome);
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
      // Reveal outcome after a short, deliberate delay (~1.2s).
      window.setTimeout(() => {
        setOutcome(optionOutcome);
        setPendingOutcome(null);
      }, 1200);
    } else if (next) {
      setCurrentQuestionId(next);
    }
  }, [answers, user, selectedPathway]);

  const reset = useCallback(() => {
    setSelectedPathway(null);
    setCurrentQuestionId(null);
    setAnswers([]);
    setOutcome(null);
    setPendingOutcome(null);
    setSelectedCategory(null);
  }, []);

  const backToCategory = useCallback(() => {
    setSelectedPathway(null);
    setCurrentQuestionId(null);
    setAnswers([]);
    setOutcome(null);
    setPendingOutcome(null);
  }, []);

  // ========================
  // CATEGORY CAROUSEL (HOME)
  // ========================
  if (!selectedCategory && !selectedPathway) {
    return (
      <motion.div
        className="space-y-6 pb-4 pt-1"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="pt-1">
          <h1 className="font-serif text-[30px] leading-tight tracking-[-0.01em]" style={{ color: "hsl(var(--dark))" }}>
            Symptom Triage
          </h1>
          <p className="text-[13px] font-sans mt-1.5 leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
            Choose a category to begin your assessment
          </p>
        </motion.div>

        {/* Category Carousel Grid — 2 columns */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          {activeCategories.map((cat, i) => {
            const pathwayCount = groupedPathways[cat.id]?.length || 0;
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.04, type: "spring", stiffness: 300, damping: 28 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedCategory(cat.id)}
                className="relative rounded-[18px] overflow-hidden text-left ios-press"
                style={{
                  aspectRatio: "3/4",
                  boxShadow: "0 4px 20px -4px hsla(0,0%,0%,0.12)",
                }}
              >
                {/* Image */}
                <img
                  src={CATEGORY_IMAGES[cat.id] || imgFetal}
                  alt={cat.label}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(0deg, hsla(0,0%,0%,0.7) 0%, hsla(0,0%,0%,0.25) 50%, hsla(0,0%,0%,0.05) 100%)",
                  }}
                />
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <h3 className="text-white text-[14px] font-semibold font-sans leading-tight">
                    {cat.label}
                  </h3>
                  <p className="text-white/60 text-[11px] font-sans mt-0.5">
                    {pathwayCount} symptom{pathwayCount !== 1 ? "s" : ""}
                  </p>
                </div>
                {/* Top-right badge */}
                <div
                  className="absolute top-3 right-3 w-[28px] h-[28px] rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
                >
                  <IonIcon name="chevron-forward" size={14} style={{ color: "white" }} />
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Medical disclaimer */}
        <motion.div variants={fadeUp} className="flex items-start gap-2.5 pt-1">
          <IonIcon name="shield-checkmark" size={14} style={{ color: "hsl(var(--green))" }} />
          <p className="text-[10px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
            Adapted from NHS 111 protocols with Nigerian clinical context. This tool does not replace professional medical advice.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  // ========================
  // CATEGORY SYMPTOM LIST
  // ========================
  if (selectedCategory && !selectedPathway) {
    const cat = CATEGORIES.find((c) => c.id === selectedCategory);
    const pathways = groupedPathways[selectedCategory] || [];

    return (
      <motion.div
        className="space-y-5 pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Back + Header with category image */}
        <div className="relative rounded-[20px] overflow-hidden -mx-0" style={{ marginTop: 4 }}>
          <img
            src={CATEGORY_IMAGES[selectedCategory] || imgFetal}
            alt={cat?.label}
            className="w-full h-[160px] object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(0deg, hsla(0,0%,0%,0.65) 0%, hsla(0,0%,0%,0.2) 60%, hsla(0,0%,0%,0.1) 100%)" }}
          />
          <div className="absolute top-3 left-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-0.5 ios-press px-2 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
            >
              <IonIcon name="chevron-back" size={18} style={{ color: "white" }} />
              <span className="text-[13px] font-sans font-medium text-white">Back</span>
            </motion.button>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="font-serif text-[26px] text-white leading-tight">
              {cat?.label}
            </h1>
            <p className="text-white/60 text-[12px] font-sans mt-1">
              {pathways.length} symptom{pathways.length !== 1 ? "s" : ""} to check
            </p>
          </div>
        </div>

        {/* Symptom pathway cards */}
        <div
          className="rounded-[20px] overflow-hidden"
          style={{
            background: "hsl(var(--surface))",
            boxShadow: "0 2px 16px -4px hsla(0,0%,0%,0.08)",
          }}
        >
          {pathways.map((pathway, i) => {
            const isLast = i === pathways.length - 1;
            const isGreen = i % 2 === 0;
            return (
              <div key={pathway.id}>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, type: "spring", stiffness: 300, damping: 28 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startPathway(pathway)}
                  className="w-full flex items-center gap-3.5 px-4 py-4 text-left ios-press"
                >
                  <div
                    className="w-[44px] h-[44px] rounded-[14px] flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isGreen
                        ? "linear-gradient(135deg, hsl(var(--light-green)), hsl(144 28% 89%))"
                        : "linear-gradient(135deg, hsl(var(--light-coral)), hsl(14 82% 92%))",
                      boxShadow: isGreen
                        ? "0 3px 12px -3px hsla(153,42%,30%,0.2)"
                        : "0 3px 12px -3px hsla(11,74%,63%,0.2)",
                    }}
                  >
                    <IonIcon
                      name={pathway.icon}
                      size={22}
                      style={{ color: isGreen ? "hsl(var(--green))" : "hsl(var(--coral))" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
                      {pathway.name}
                    </h3>
                    <p className="text-[11px] font-sans mt-0.5 line-clamp-1" style={{ color: "hsl(var(--text-muted))" }}>
                      {pathway.description}
                    </p>
                  </div>
                  <div
                    className="w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--light-green))" }}
                  >
                    <IonIcon name="chevron-forward" size={14} style={{ color: "hsl(var(--green))" }} />
                  </div>
                </motion.button>
                {!isLast && (
                  <div className="mx-4 h-px" style={{ background: "hsl(var(--border-subtle))" }} />
                )}
              </div>
            );
          })}
        </div>
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
        <motion.button whileTap={{ scale: 0.92 }} onClick={reset} className="ios-press flex items-center gap-1 -ml-1.5 py-1">
          <IonIcon name="chevron-back" size={22} style={{ color: "hsl(var(--green))" }} />
          <span className="text-[15px] font-sans font-medium" style={{ color: "hsl(var(--green))" }}>Start over</span>
        </motion.button>

        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
          className="rounded-[22px] p-6 relative overflow-hidden"
          style={{ background: config.bg, boxShadow: config.glow }}
        >
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
            This is guidance only and does not replace professional medical advice.
          </p>
        </div>
      </motion.div>
    );
  }

  // ========================
  // QUESTION FLOW — Premium UI
  // ========================
  return (
    <motion.div
      className="space-y-5 pb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 pt-1">
        <motion.button whileTap={{ scale: 0.92 }} onClick={backToCategory} className="ios-press -ml-1.5 p-1">
          <IonIcon name="chevron-back" size={24} style={{ color: "hsl(var(--green))" }} />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-[21px] truncate" style={{ color: "hsl(var(--dark))" }}>{selectedPathway?.name}</h1>
        </div>
        <span
          className="text-[11px] font-sans font-semibold px-3 py-1.5 rounded-full"
          style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
        >
          Step {stepNumber}
        </span>
      </div>

      {/* Progress bar — segmented by steps taken */}
      <div className="flex gap-1">
        {Array.from({ length: Math.max(totalStepsEstimate, stepNumber) }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[5px] rounded-full overflow-hidden"
            style={{ background: "hsl(var(--border))" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: i < stepNumber
                  ? "linear-gradient(90deg, hsl(var(--green)), hsl(153 42% 40%))"
                  : "transparent",
              }}
              initial={{ width: 0 }}
              animate={{ width: i < stepNumber ? "100%" : "0%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        ))}
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-4"
          >
            {/* Question text — premium card */}
            <div
              className="rounded-[20px] p-5 relative overflow-hidden"
              style={{
                background: "linear-gradient(145deg, hsl(153 42% 22%), hsl(153 42% 30%), hsl(153 38% 26%))",
                boxShadow: "0 8px 32px -8px hsla(153,42%,20%,0.4)",
              }}
            >
              <div className="absolute -top-16 -right-16 w-[120px] h-[120px] rounded-full" style={{ background: "radial-gradient(circle, hsla(0,0%,100%,0.06) 0%, transparent 70%)" }} />
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-[24px] h-[24px] rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <span className="text-[11px] font-sans font-bold text-white">{stepNumber}</span>
                </div>
                <span className="text-[10px] font-sans font-semibold tracking-wider uppercase text-white/40">
                  Question
                </span>
              </div>
              <h2 className="font-serif text-[20px] leading-snug text-white">
                {currentQuestion.text}
              </h2>
            </div>

            {/* Answer options — premium cards */}
            <div className="space-y-2.5">
              {currentQuestion.options.map((option, i) => {
                const isGreen = i % 2 === 0;
                return (
                  <motion.button
                    key={option.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.07, type: "spring", stiffness: 300, damping: 28 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAnswer(option.label, option.next, option.outcome)}
                    className="w-full rounded-[16px] p-4 text-left ios-press flex items-center gap-3.5 group"
                    style={{
                      background: "hsl(var(--surface))",
                      boxShadow: "0 2px 8px -2px hsla(0,0%,0%,0.06), 0 1px 2px hsla(0,0%,0%,0.04)",
                      border: "1px solid hsl(var(--border-subtle))",
                    }}
                  >
                    <div
                      className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isGreen
                          ? "linear-gradient(135deg, hsl(var(--light-green)), hsl(144 28% 89%))"
                          : "linear-gradient(135deg, hsl(var(--light-coral)), hsl(14 82% 92%))",
                      }}
                    >
                      <span
                        className="text-[13px] font-sans font-bold"
                        style={{ color: isGreen ? "hsl(var(--green))" : "hsl(var(--coral))" }}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                    </div>
                    <span className="flex-1 text-[13.5px] font-sans font-medium leading-snug" style={{ color: "hsl(var(--dark))" }}>
                      {option.label}
                    </span>
                    <IonIcon name="chevron-forward" size={14} style={{ color: "hsl(var(--text-muted))" }} />
                  </motion.button>
                );
              })}
            </div>

            {/* Reassurance footer */}
            <div className="flex items-center gap-2 pt-2">
              <IonIcon name="lock-closed" size={12} style={{ color: "hsl(var(--text-muted))" }} />
              <p className="text-[10px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                Your answers are private and encrypted
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TriageScreen;

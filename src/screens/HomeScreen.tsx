import { useState, memo } from "react";
import TopBar from "@/components/navigation/TopBar";
import { useAuthStore } from "@/stores/authStore";
import IonIcon from "@/components/IonIcon";
import { motion, AnimatePresence } from "framer-motion";
import LazyVideo from "@/components/LazyVideo";

interface HomeScreenProps {
  onNavigate: (tab: string) => void;
}

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
};

const QUICK_ACCESS = [
  { id: "antenatal", label: "Antenatal", icon: "medkit-outline", color: "hsl(var(--green))", bg: "hsl(var(--light-green))" },
  { id: "sos", label: "Emergency", icon: "shield-checkmark-outline", color: "hsl(var(--coral))", bg: "hsl(var(--light-coral))" },
  { id: "baby-shower", label: "Baby Shower", icon: "balloon-outline", color: "hsl(var(--green))", bg: "hsl(var(--light-green))" },
  { id: "community", label: "Voice Out", icon: "chatbubbles-outline", color: "hsl(var(--coral))", bg: "hsl(var(--light-coral))" },
];

const COMMON_SYMPTOMS = [
  {
    name: "Morning Sickness",
    icon: "water-outline",
    cause: "Hormonal changes (hCG surge)",
    detail: "Nausea and vomiting are most common in the first trimester. Eating small, frequent meals and staying hydrated can help. It usually resolves by week 14–16.",
  },
  {
    name: "Fatigue",
    icon: "moon-outline",
    cause: "Progesterone increase & blood volume changes",
    detail: "Your body is working overtime to support the growing baby. Rest when you can, maintain iron-rich nutrition, and avoid overexertion.",
  },
  {
    name: "Back Pain",
    icon: "body-outline",
    cause: "Shifting centre of gravity & ligament relaxation",
    detail: "As your belly grows, your posture shifts. Gentle stretching, proper support pillows, and prenatal exercises can relieve discomfort.",
  },
  {
    name: "Swollen Feet",
    icon: "footsteps-outline",
    cause: "Fluid retention & increased blood volume",
    detail: "Mild swelling (oedema) in ankles and feet is normal, especially in the third trimester. Elevate your feet and reduce salt intake. Sudden severe swelling needs medical attention.",
  },
  {
    name: "Heartburn",
    icon: "flame-outline",
    cause: "Relaxed oesophageal sphincter & uterine pressure",
    detail: "Progesterone relaxes the valve between your stomach and oesophagus. Eat smaller meals, avoid spicy food, and stay upright after eating.",
  },
  {
    name: "Headaches",
    icon: "flash-outline",
    cause: "Hormonal fluctuations & blood pressure changes",
    detail: "Common in the first and third trimesters. Stay hydrated, rest in a dark room, and avoid screen fatigue. Persistent or severe headaches should be reported to your doctor.",
  },
  {
    name: "Frequent Urination",
    icon: "timer-outline",
    cause: "Growing uterus pressing on the bladder",
    detail: "Very common throughout pregnancy, especially in the first and third trimesters. Don't reduce water intake — hydration is essential. Kegel exercises can help with bladder control.",
  },
  {
    name: "Braxton Hicks",
    icon: "pulse-outline",
    cause: "Uterine muscles practising for labour",
    detail: "These irregular, usually painless contractions are your body's rehearsal. They typically start mid-pregnancy. If they become regular or painful, contact your healthcare provider.",
  },
];

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const currentWeek = useAuthStore((s) => s.getCurrentWeek());
  const daysLeft = useAuthStore((s) => s.getDaysRemaining());
  const [expandedSymptom, setExpandedSymptom] = useState<number | null>(null);

  const displayName = user?.full_name?.split(" ")[0] || "there";
  const greeting = getGreeting();
  const trimester = currentWeek <= 13 ? "1st Trimester" : currentWeek <= 26 ? "2nd Trimester" : currentWeek <= 40 ? "3rd Trimester" : "Postpartum";
  const hasDueDate = !!user?.due_date;

  return (
    <motion.div
      className="space-y-6 pb-4"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* Top Bar */}
      <motion.div variants={fadeUp}>
        <TopBar onNotificationsPress={() => onNavigate("notifications")} />
      </motion.div>

      {/* Hero Greeting */}
      <motion.div
        variants={fadeUp}
        className="rounded-[20px] p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, hsl(153 42% 22%), hsl(153 42% 30%), hsl(153 38% 26%))",
          boxShadow: "0 8px 32px -8px hsla(153,42%,20%,0.5)",
        }}
      >
        <div className="absolute -top-20 -right-20 w-[160px] h-[160px] rounded-full" style={{ background: "radial-gradient(circle, hsla(0,0%,100%,0.06) 0%, transparent 70%)" }} />
        <p className="text-white/50 text-[13px] font-sans">{greeting}</p>
        <h1 className="text-white text-[26px] font-serif mt-0.5">
          Hello, <span style={{ color: "hsl(var(--coral))" }}>{displayName}</span>
        </h1>
        {hasDueDate ? (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[11px] font-sans font-semibold tracking-wide uppercase px-3 py-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "hsl(var(--coral))" }}>
              Week {currentWeek} · {trimester}
            </span>
            <span className="text-[11px] font-sans font-medium px-3 py-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
              {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? "Due today!" : `${Math.abs(daysLeft)} days since due date`}
            </span>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate("profile")}
            className="flex items-center gap-1.5 mt-3 ios-press"
          >
            <span className="text-[13px] font-sans font-medium" style={{ color: "hsl(var(--coral))" }}>Set your due date →</span>
          </motion.button>
        )}
      </motion.div>

      {/* Quick Access Grid */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-2.5">QUICK ACCESS</p>
        <div
          className="grid grid-cols-4 gap-2 rounded-[20px] p-3"
          style={{
            background: "hsl(var(--surface))",
            boxShadow: "0 2px 12px -2px hsla(0,0%,0%,0.06)",
          }}
        >
          {QUICK_ACCESS.map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-1.5 ios-press py-1"
            >
              <div
                className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center relative overflow-hidden"
                style={{ background: item.bg }}
              >
                <div className="absolute inset-0 opacity-[0.08]" style={{ background: `radial-gradient(circle at 30% 30%, ${item.color}, transparent 70%)` }} />
                <IonIcon name={item.icon} size={24} style={{ color: item.color }} />
              </div>
              <span className="text-[10px] font-sans font-semibold text-center leading-tight tracking-wide" style={{ color: "hsl(var(--dark))" }}>
                {item.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Video Explainer */}
      <motion.div variants={fadeUp} className="-mt-1">
        <h2 className="font-serif text-[20px] mb-2" style={{ color: "hsl(var(--dark))" }}>How Triage Works</h2>
        <div
          className="rounded-[18px] overflow-hidden"
          style={{
            boxShadow: "0 1px 3px hsla(0,0%,0%,0.04), 0 4px 16px -2px hsla(0,0%,0%,0.06)",
          }}
        >
          <video
            className="w-full"
            controls
            playsInline
            preload="metadata"
            poster=""
            style={{ borderRadius: "18px" }}
          >
            <source src="/videos/explainer.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </motion.div>

      {/* Common Symptoms */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-[20px]" style={{ color: "hsl(var(--dark))" }}>Common Symptoms</h2>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>
            {COMMON_SYMPTOMS.length} topics
          </span>
        </div>
        <div
          className="rounded-[20px] overflow-hidden"
          style={{
            background: "hsl(var(--surface))",
            boxShadow: "0 2px 16px -4px hsla(0,0%,0%,0.08)",
          }}
        >
          {COMMON_SYMPTOMS.map((symptom, i) => {
            const isExpanded = expandedSymptom === i;
            const isGreen = i % 2 === 0;
            const isLast = i === COMMON_SYMPTOMS.length - 1;
            return (
              <div key={symptom.name}>
                <button
                  onClick={() => setExpandedSymptom(isExpanded ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left ios-press"
                >
                  <div
                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0"
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
                      name={symptom.icon}
                      size={18}
                      style={{ color: isGreen ? "hsl(var(--green))" : "hsl(var(--coral))" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>{symptom.name}</h3>
                    <p className="text-[10px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>{symptom.cause}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IonIcon
                      name="chevron-down"
                      size={14}
                      style={{ color: "hsl(var(--text-muted))" }}
                    />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 pt-0">
                        <div
                          className="rounded-[14px] p-3.5"
                          style={{
                            background: isGreen
                              ? "linear-gradient(135deg, hsl(var(--light-green)), hsla(144,28%,93%,0.5))"
                              : "linear-gradient(135deg, hsl(var(--light-coral)), hsla(14,82%,96%,0.5))",
                          }}
                        >
                          <p className="text-[12.5px] font-sans leading-[1.7]" style={{ color: "hsl(var(--dark))" }}>
                            {symptom.detail}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!isLast && (
                  <div className="mx-4 h-px" style={{ background: "hsl(var(--border-subtle))" }} />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HomeScreen;

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface PremiumScreenProps {
  onBack: () => void;
}

const plans = [
  {
    id: "monthly",
    label: "Monthly",
    price: "₦2,500",
    period: "/month",
    save: null,
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "₦20,000",
    period: "/year",
    save: "Save 33%",
  },
];

const benefits = [
  { icon: "sparkles", title: "AI Health Chat", desc: "Unlimited access to TendHerBot for instant pregnancy advice" },
  { icon: "videocam", title: "Expert Consultations", desc: "Book video calls with OB-GYNs, midwives & nutritionists" },
  { icon: "heart-circle", title: "Baby Shower Planner", desc: "Plan your dream baby shower with our curated tools" },
  { icon: "document-text", title: "Detailed Health Reports", desc: "Weekly personalised health reports & baby development" },
  { icon: "people", title: "Priority Community", desc: "Verified badge & priority access to expert Q&A sessions" },
  { icon: "notifications", title: "Smart Reminders", desc: "Medication, appointment & hydration reminders" },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
};

const PremiumScreen = ({ onBack }: PremiumScreenProps) => {
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center ios-press"
          style={{ background: "hsl(var(--light-coral))" }}
        >
          <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--coral))" }} />
        </motion.button>
        <div>
          <h1 className="font-serif text-dark" style={{ fontSize: "26px" }}>Go Premium</h1>
          <p className="text-text-muted text-[13px] font-sans">Unlock the full TendHer experience</p>
        </div>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="hero-card p-6 text-center"
      >
        <div className="relative z-10">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-[64px] h-[64px] rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <IonIcon name="diamond" size={32} style={{ color: "hsl(var(--coral))" }} />
          </motion.div>
          <h2 className="text-white text-[24px] font-serif">TendHer Premium</h2>
          <p className="text-white/50 text-[13px] font-sans mt-2 max-w-[260px] mx-auto">
            Your complete pregnancy companion — powered by AI, backed by experts
          </p>
        </div>
      </motion.div>

      {/* Plan selector */}
      <div className="flex gap-3">
        {plans.map((plan) => (
          <motion.button
            key={plan.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSelectedPlan(plan.id)}
            className="flex-1 p-4 rounded-2xl text-center relative overflow-hidden transition-all duration-200"
            style={{
              background: selectedPlan === plan.id ? "hsl(var(--green))" : "hsl(var(--surface))",
              boxShadow: selectedPlan === plan.id
                ? "0 4px 20px rgba(45,106,79,0.3)"
                : "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            {plan.save && (
              <span
                className="absolute top-0 right-0 label-caps px-2 py-[2px] rounded-bl-lg"
                style={{
                  background: "hsl(var(--coral))",
                  color: "white",
                  fontSize: "8px",
                }}
              >
                {plan.save}
              </span>
            )}
            <span
              className="text-[12px] font-semibold font-sans block mb-1"
              style={{
                color: selectedPlan === plan.id ? "rgba(255,255,255,0.6)" : "hsl(var(--text-muted))",
              }}
            >
              {plan.label}
            </span>
            <span
              className="text-[22px] font-bold font-sans"
              style={{
                color: selectedPlan === plan.id ? "white" : "hsl(var(--dark))",
              }}
            >
              {plan.price}
            </span>
            <span
              className="text-[12px] font-sans"
              style={{
                color: selectedPlan === plan.id ? "rgba(255,255,255,0.5)" : "hsl(var(--text-muted))",
              }}
            >
              {plan.period}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Benefits */}
      <div>
        <h2 className="font-serif text-dark text-[20px] mb-3">Everything You Get</h2>
        <motion.div
          className="tend-card overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              variants={itemVariants}
              className="flex items-center gap-3.5 px-[18px] py-[15px]"
              style={{
                borderBottom: i < benefits.length - 1 ? "0.5px solid hsl(var(--border))" : "none",
              }}
            >
              <div
                className="w-[40px] h-[40px] rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--light-coral))" }}
              >
                <IonIcon name={b.icon} size={20} style={{ color: "hsl(var(--coral))" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-dark text-[14px] font-semibold font-sans">{b.title}</h4>
                <p className="text-text-muted text-[12px] font-sans mt-0.5 leading-tight">{b.desc}</p>
              </div>
              <IonIcon name="checkmark-circle" size={18} style={{ color: "hsl(var(--green))" }} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Subscribe CTA */}
      <div className="space-y-3">
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="w-full py-[16px] rounded-2xl text-[16px] font-bold font-sans flex items-center justify-center gap-2"
          style={{
            background: "hsl(var(--coral))",
            color: "white",
            boxShadow: "0 6px 24px rgba(232,115,90,0.4)",
          }}
        >
          <IonIcon name="diamond" size={18} style={{ color: "white" }} />
          Subscribe — {selectedPlan === "yearly" ? "₦20,000/yr" : "₦2,500/mo"}
        </motion.button>
        <p className="text-center text-text-muted text-[11px] font-sans">
          Cancel anytime • 7-day free trial • Secure payment
        </p>
      </div>
    </div>
  );
};

export default PremiumScreen;

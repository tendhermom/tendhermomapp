import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface PremiumScreenProps {
  onBack: () => void;
}

const plans = [
  { id: "monthly", label: "Monthly", price: "₦2,500", period: "/month", save: null },
  { id: "yearly", label: "Yearly", price: "₦20,000", period: "/year", save: "Save 33%" },
];

const benefits = [
  { icon: "chatbox-ellipses", title: "AI Health Chat", desc: "Unlimited access to TendHerBot for instant pregnancy advice" },
  { icon: "videocam", title: "Expert Consultations", desc: "Book video calls with OB-GYNs, midwives & nutritionists" },
  { icon: "heart-circle", title: "Baby Shower Planner", desc: "Plan your dream baby shower with our curated tools" },
  { icon: "document-text", title: "Detailed Health Reports", desc: "Weekly personalised health reports & baby development" },
  { icon: "people", title: "Priority Community", desc: "Verified badge & priority access to expert Q&A sessions" },
  { icon: "notifications", title: "Smart Reminders", desc: "Medication, appointment & hydration reminders" },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const PremiumScreen = ({ onBack }: PremiumScreenProps) => {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [processing, setProcessing] = useState(false);
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  // Check for payment verification on return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");
    if (reference) {
      verifyPayment(reference);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSubscribe = async () => {
    if (!user) return;
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("paystack-payment", {
        body: {
          action: "initialize",
          plan: selectedPlan,
          callback_url: window.location.href,
        },
      });

      if (error || !data?.authorization_url) {
        toast.error(data?.error || "Failed to start payment");
        setProcessing(false);
        return;
      }

      // Redirect to Paystack
      window.location.href = data.authorization_url;
    } catch {
      toast.error("Payment service unavailable");
      setProcessing(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-payment", {
        body: { action: "verify", reference },
      });

      if (data?.success) {
        toast.success("Welcome to Premium!");
        if (user) await fetchProfile(user.id);
      } else {
        toast.error(data?.message || "Payment verification failed");
      }
    } catch {
      toast.error("Could not verify payment");
    }
    setProcessing(false);
  };

  const isPremium = user?.plan_type === "premium";

  if (isPremium) {
    return (
      <div className="space-y-6 pb-6">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center ios-press"
            style={{ background: "hsl(var(--light-coral))" }}
          >
            <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--coral))" }} />
          </motion.button>
          <h1 className="font-serif" style={{ fontSize: "26px", color: "hsl(var(--dark))" }}>Premium</h1>
        </div>

        <div className="hero-card p-6 text-center">
          <div className="relative z-10">
            <div
              className="w-[64px] h-[64px] rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <IonIcon name="diamond" size={32} style={{ color: "hsl(var(--coral))" }} />
            </div>
            <h2 className="text-white text-[24px] font-serif">You're Premium!</h2>
            <p className="text-white/50 text-[14px] font-sans mt-2">
              You have full access to all TendherMom features
            </p>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-[20px] mb-3" style={{ color: "hsl(var(--dark))" }}>Your Benefits</h2>
          <div className="tend-card overflow-hidden">
            {benefits.map((b, i) => (
              <div
                key={b.title}
                className="flex items-center gap-3.5 px-[18px] py-[15px]"
                style={{ borderBottom: i < benefits.length - 1 ? "0.5px solid hsl(var(--border))" : "none" }}
              >
                <div
                  className="w-[40px] h-[40px] rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(var(--light-coral))" }}
                >
                  <IonIcon name={b.icon} size={20} style={{ color: "hsl(var(--coral))" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>{b.title}</h4>
                  <p className="text-[12px] font-sans mt-0.5 leading-tight" style={{ color: "hsl(var(--text-muted))" }}>{b.desc}</p>
                </div>
                <IonIcon name="checkmark-circle" size={18} style={{ color: "hsl(var(--green))" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="font-serif" style={{ fontSize: "26px", color: "hsl(var(--dark))" }}>Go Premium</h1>
          <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Unlock the full TendherMom experience</p>
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
          <h2 className="text-white text-[24px] font-serif">TendherMom Premium</h2>
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
                className="absolute top-0 right-0 px-2 py-[2px] rounded-bl-lg font-sans font-bold"
                style={{ background: "hsl(var(--coral))", color: "white", fontSize: "8px", letterSpacing: "0.5px" }}
              >
                {plan.save}
              </span>
            )}
            <span
              className="text-[12px] font-semibold font-sans block mb-1"
              style={{ color: selectedPlan === plan.id ? "rgba(255,255,255,0.6)" : "hsl(var(--text-muted))" }}
            >
              {plan.label}
            </span>
            <span
              className="text-[22px] font-bold font-sans"
              style={{ color: selectedPlan === plan.id ? "white" : "hsl(var(--dark))" }}
            >
              {plan.price}
            </span>
            <span
              className="text-[12px] font-sans"
              style={{ color: selectedPlan === plan.id ? "rgba(255,255,255,0.5)" : "hsl(var(--text-muted))" }}
            >
              {plan.period}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Benefits */}
      <div>
        <h2 className="font-serif text-[20px] mb-3" style={{ color: "hsl(var(--dark))" }}>Everything You Get</h2>
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
              style={{ borderBottom: i < benefits.length - 1 ? "0.5px solid hsl(var(--border))" : "none" }}
            >
              <div
                className="w-[40px] h-[40px] rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--light-coral))" }}
              >
                <IonIcon name={b.icon} size={20} style={{ color: "hsl(var(--coral))" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>{b.title}</h4>
                <p className="text-[12px] font-sans mt-0.5 leading-tight" style={{ color: "hsl(var(--text-muted))" }}>{b.desc}</p>
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
          onClick={handleSubscribe}
          disabled={processing}
          className="w-full py-[16px] rounded-2xl text-[16px] font-bold font-sans flex items-center justify-center gap-2"
          style={{
            background: "hsl(var(--coral))",
            color: "white",
            boxShadow: "0 6px 24px rgba(232,115,90,0.4)",
            opacity: processing ? 0.7 : 1,
          }}
        >
          <IonIcon name="diamond" size={18} style={{ color: "white" }} />
          {processing ? "Processing…" : `Subscribe — ${selectedPlan === "yearly" ? "₦20,000/yr" : "₦2,500/mo"}`}
        </motion.button>
        <p className="text-center text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
          Cancel anytime • Secure payment via Paystack
        </p>
      </div>
    </div>
  );
};

export default PremiumScreen;

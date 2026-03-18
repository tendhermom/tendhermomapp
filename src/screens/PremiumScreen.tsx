import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";

interface PremiumScreenProps {
  onBack: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const FEATURES = [
  {
    icon: "shield-checkmark",
    title: "5 Emergency Contacts",
    desc: "Protect your loved ones with more SOS contacts",
    free: "1 contact",
    premium: "5 contacts",
  },
  {
    icon: "flash",
    title: "Unlimited SOS Triggers",
    desc: "No monthly limits on emergency alerts",
    free: "1/month",
    premium: "Unlimited",
  },
  {
    icon: "calendar",
    title: "Book Appointments",
    desc: "Schedule 15-min sessions with health experts",
    free: "—",
    premium: "Included",
  },
  {
    icon: "gift",
    title: "Baby Shower Gifts",
    desc: "Enable gift-giving on your baby celebration posts",
    free: "—",
    premium: "Included",
  },
  {
    icon: "chatbubble-ellipses",
    title: "Priority AI Chat",
    desc: "Faster responses and extended conversation history",
    free: "Basic",
    premium: "Priority",
  },
  {
    icon: "ribbon",
    title: "Exclusive Badges",
    desc: "Stand out in the community with premium badges",
    free: "—",
    premium: "Included",
  },
];

const PLANS = [
  {
    id: "weekly",
    label: "Weekly",
    price: "₦700",
    period: "/week",
    tag: null,
  },
  {
    id: "monthly",
    label: "Monthly",
    price: "₦2,500",
    period: "/month",
    tag: "Popular",
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "₦25,000",
    period: "/year",
    tag: "Save 52%",
  },
];

const PremiumScreen = ({ onBack }: PremiumScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan_type === "premium";

  return (
    <motion.div
      className="space-y-6 pb-4"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}>
          <IonIcon name="chevron-back" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1 className="font-serif text-[24px] flex-1" style={{ color: "hsl(var(--dark))" }}>
          Premium
        </h1>
      </motion.div>

      {/* Hero */}
      <motion.div
        variants={fadeUp}
        className="relative rounded-[24px] overflow-hidden p-6"
        style={{
          background: "linear-gradient(145deg, hsl(153 42% 22%), hsl(153 42% 32%))",
          boxShadow: "0 12px 40px -8px hsla(153, 42%, 22%, 0.45)",
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <IonIcon name="diamond" size={22} style={{ color: "hsl(var(--coral))" }} />
            </div>
            {isPremium && (
              <span
                className="text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: "rgba(232,115,90,0.25)", color: "hsl(var(--coral))" }}
              >
                Active
              </span>
            )}
          </div>
          <h2 className="text-white font-serif text-[26px] leading-tight tracking-[-0.01em]">
            {isPremium ? "You're Premium" : "Upgrade to Premium"}
          </h2>
          <p className="text-white/55 text-[14px] font-sans mt-2 leading-relaxed max-w-[260px]">
            {isPremium
              ? "You have access to all premium features. Thank you for your support!"
              : "Unlock the full power of TendherMom for you and your baby's safety."}
          </p>
        </div>
        {/* Decorative circles */}
        <div
          className="absolute -top-10 -right-10 w-[120px] h-[120px] rounded-full"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div
          className="absolute -bottom-8 -right-4 w-[80px] h-[80px] rounded-full"
          style={{ background: "rgba(255,255,255,0.03)" }}
        />
      </motion.div>

      {/* Plan selection (only for non-premium) */}
      {!isPremium && (
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          {PLANS.map((plan) => (
            <motion.button
              key={plan.id}
              whileTap={{ scale: 0.97 }}
              className="relative tend-card p-4 text-left"
              style={{
                border: plan.id === "yearly" ? "2px solid hsl(var(--green))" : "2px solid transparent",
              }}
            >
              {plan.tag && (
                <span
                  className="absolute -top-2.5 right-3 text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: "hsl(var(--green))", color: "white" }}
                >
                  {plan.tag}
                </span>
              )}
              <p className="text-[12px] font-sans font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>
                {plan.label}
              </p>
              <div className="flex items-baseline gap-0.5 mt-1">
                <span className="text-[24px] font-serif font-bold" style={{ color: "hsl(var(--dark))" }}>
                  {plan.price}
                </span>
                <span className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                  {plan.period}
                </span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Features comparison */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-3">WHAT YOU GET</p>
        <div className="tend-card overflow-hidden">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="flex items-start gap-3.5 px-[18px] py-[16px]"
              style={{
                borderBottom: i < FEATURES.length - 1 ? "0.5px solid hsl(var(--border))" : "none",
              }}
            >
              <div
                className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "hsl(var(--light-green))" }}
              >
                <IonIcon name={f.icon} size={18} style={{ color: "hsl(var(--green))" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                  {f.title}
                </h4>
                <p className="text-[12px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                  {f.desc}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className="text-[10px] font-sans font-semibold px-2 py-[2px] rounded-full"
                    style={{ background: "hsl(var(--bg))", color: "hsl(var(--text-muted))" }}
                  >
                    Free: {f.free}
                  </span>
                  <span
                    className="text-[10px] font-sans font-semibold px-2 py-[2px] rounded-full"
                    style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
                  >
                    Premium: {f.premium}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      {!isPremium && (
        <motion.div variants={fadeUp} className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full py-[16px] rounded-2xl text-white text-[16px] font-semibold font-sans"
            style={{
              background: "linear-gradient(135deg, hsl(153 42% 28%), hsl(153 42% 36%))",
              boxShadow: "0 6px 24px -4px hsla(153, 42%, 28%, 0.4)",
            }}
          >
            Upgrade Now
          </motion.button>
          <p className="text-center text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
            Cancel anytime · Secure payment · Instant activation
          </p>
        </motion.div>
      )}

      {/* Already premium — manage */}
      {isPremium && (
        <motion.div variants={fadeUp} className="tend-card p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(var(--light-green))" }}
            >
              <IonIcon name="checkmark-circle" size={20} style={{ color: "hsl(var(--green))" }} />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                Premium Active
              </p>
              <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                All features unlocked
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PremiumScreen;

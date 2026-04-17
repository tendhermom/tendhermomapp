import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";
import {
  isNativeBillingAvailable,
  purchase,
  restorePurchases,
  type PlusProductId,
} from "@/lib/native-billing";
import { hapticSuccess, hapticError, hapticSelection } from "@/lib/despia";

interface PremiumScreenProps {
  onBack: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const FEATURES = [
  {
    icon: "gift",
    title: "Baby Shower & Gifts",
    desc: "Celebrate your baby and receive Peer-to-Peer gifts from loved ones",
    free: "—",
    premium: "Included",
  },
  {
    icon: "chatbubble-ellipses",
    title: "Unlimited AI Chat",
    desc: "Ask the AI Health Assistant anytime — no weekly limit",
    free: "2 / week",
    premium: "Unlimited",
  },
  {
    icon: "location",
    title: "Rescue Map",
    desc: "Find nearby health centers, pharmacies & specialists",
    free: "Limited",
    premium: "Full Access",
  },
  {
    icon: "ribbon",
    title: "Exclusive Badges",
    desc: "Stand out in the community with premium badges",
    free: "—",
    premium: "Included",
  },
];

const PLANS: Array<{
  id: "weekly" | "monthly" | "yearly";
  productId: PlusProductId;
  label: string;
  price: string;
  period: string;
  tag: string | null;
}> = [
  {
    id: "weekly",
    productId: "tendhermom_plus_weekly",
    label: "Weekly",
    price: "₦300",
    period: "/week",
    tag: null,
  },
  {
    id: "monthly",
    productId: "tendhermom_plus_monthly",
    label: "Monthly",
    price: "₦1,000",
    period: "/month",
    tag: "Popular",
  },
  {
    id: "yearly",
    productId: "tendhermom_plus_yearly",
    label: "Yearly",
    price: "₦10,000",
    period: "/year",
    tag: "Save 36%",
  },
];

const PremiumScreen = ({ onBack }: PremiumScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const isPremium = user?.plan_type === "premium";
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly" | "yearly">("yearly");
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);

  useEffect(() => {
    setNativeAvailable(isNativeBillingAvailable());
  }, []);

  const handlePurchase = async () => {
    if (purchasing) return;
    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan) return;

    if (!nativeAvailable) {
      toast.error("Subscriptions are only available in the TendherMom mobile app.");
      hapticError();
      return;
    }

    setPurchasing(true);
    hapticSelection();
    try {
      const result = await purchase(plan.productId);
      if (result.cancelled) {
        // Silent — user backed out
        return;
      }
      if (!result.success) {
        toast.error(result.error || "Purchase failed. Please try again.");
        hapticError();
        return;
      }
      hapticSuccess();
      toast.success("Welcome to Plus! ✨");
      if (user?.id) await fetchProfile(user.id);
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong.");
      hapticError();
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (!result.success) {
        toast.error(result.error || "No previous purchases found.");
        return;
      }
      if (result.plan_type === "premium") {
        hapticSuccess();
        toast.success("Plus restored ✨");
        if (user?.id) await fetchProfile(user.id);
      } else {
        toast.info("No active subscription to restore.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Restore failed.");
    } finally {
      setRestoring(false);
    }
  };

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
          TendherMom Plus
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
            {isPremium ? "You're on Plus" : "Upgrade to Plus"}
          </h2>
          <p className="text-white/55 text-[14px] font-sans mt-2 leading-relaxed max-w-[260px]">
            {isPremium
              ? "You have access to all Plus features. Thank you for your support!"
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
        <motion.div variants={fadeUp} className="space-y-3">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <motion.button
                key={plan.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPlan(plan.id)}
                className="relative w-full tend-card flex items-center justify-between px-5 py-5 transition-all duration-200"
                style={{
                  border: isSelected
                    ? "2px solid hsl(var(--green))"
                    : "1.5px solid hsl(var(--border))",
                  background: isSelected
                    ? "hsla(153, 42%, 30%, 0.06)"
                    : undefined,
                  boxShadow: isSelected
                    ? "0 4px 24px -4px hsla(153, 42%, 30%, 0.18)"
                    : "none",
                }}
              >
                {/* Tag badge */}
                {plan.tag && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-sans font-bold uppercase tracking-wider px-3 py-[3px] rounded-full whitespace-nowrap"
                    style={{ background: "hsl(var(--green))", color: "white" }}
                  >
                    {plan.tag}
                  </span>
                )}

                {/* Left: radio + label */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                    style={{
                      borderColor: isSelected ? "hsl(var(--green))" : "hsl(var(--border))",
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-[10px] h-[10px] rounded-full"
                        style={{ background: "hsl(var(--green))" }}
                      />
                    )}
                  </div>
                  <p
                    className="text-[13px] font-sans font-semibold uppercase tracking-wider transition-colors duration-200"
                    style={{ color: isSelected ? "hsl(var(--green))" : "hsl(var(--text-muted))" }}
                  >
                    {plan.label}
                  </p>
                </div>

                {/* Right: price */}
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-[26px] font-serif font-bold leading-none"
                    style={{ color: "hsl(var(--dark))" }}
                  >
                    {plan.price}
                  </span>
                  <span
                    className="text-[13px] font-sans"
                    style={{ color: "hsl(var(--text-muted))" }}
                  >
                    {plan.period}
                  </span>
                </div>
              </motion.button>
            );
          })}
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
                    Plus: {f.premium}
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
            onClick={handlePurchase}
            disabled={purchasing}
            className="w-full py-[16px] rounded-2xl text-white text-[16px] font-semibold font-sans"
            style={{
              background: "linear-gradient(135deg, hsl(153 42% 28%), hsl(153 42% 36%))",
              boxShadow: "0 6px 24px -4px hsla(153, 42%, 28%, 0.4)",
              opacity: purchasing ? 0.7 : 1,
            }}
          >
            {purchasing
              ? "Processing…"
              : `Subscribe — ${PLANS.find((p) => p.id === selectedPlan)?.price}${PLANS.find((p) => p.id === selectedPlan)?.period}`}
          </motion.button>

          {/* Apple-required legal disclosure */}
          <p
            className="text-center text-[11px] font-sans leading-relaxed px-2"
            style={{ color: "hsl(var(--text-muted))" }}
          >
            Auto-renewable subscription. Cancel anytime in your device settings.
            Payment is charged to your{" "}
            {/iPad|iPhone|iPod/.test(typeof navigator !== "undefined" ? navigator.userAgent : "")
              ? "Apple ID"
              : "Google Play account"}{" "}
            and renews automatically unless cancelled at least 24 hours before the
            period ends.
          </p>

          {/* Restore Purchases — Apple compliance requirement */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleRestore}
            disabled={restoring}
            className="w-full py-[12px] rounded-2xl text-[13px] font-sans font-semibold"
            style={{
              background: "transparent",
              border: "1.5px solid hsl(var(--border))",
              color: "hsl(var(--green))",
              opacity: restoring ? 0.6 : 1,
            }}
          >
            {restoring ? "Restoring…" : "Restore Purchases"}
          </motion.button>

          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={() => window.open("/terms", "_blank")}
              className="text-[11px] font-sans underline"
              style={{ color: "hsl(var(--text-muted))" }}
            >
              Terms
            </button>
            <span className="text-[11px]" style={{ color: "hsl(var(--text-muted))" }}>
              ·
            </span>
            <button
              onClick={() => window.open("/privacy", "_blank")}
              className="text-[11px] font-sans underline"
              style={{ color: "hsl(var(--text-muted))" }}
            >
              Privacy
            </button>
          </div>
        </motion.div>
      )}

      {/* Already premium — manage */}
      {isPremium && (
        <motion.div variants={fadeUp} className="space-y-3">
          <div className="tend-card p-4">
            <div className="flex items-center gap-3">
              <div
                className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--light-green))" }}
              >
                <IonIcon name="checkmark-circle" size={20} style={{ color: "hsl(var(--green))" }} />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                  Plus Active
                </p>
                <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                  Manage in your device settings
                </p>
              </div>
            </div>
          </div>

          {/* Restore Purchases — visible even for premium users (Apple compliance) */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleRestore}
            disabled={restoring}
            className="w-full py-[12px] rounded-2xl text-[13px] font-sans font-semibold"
            style={{
              background: "transparent",
              border: "1.5px solid hsl(var(--border))",
              color: "hsl(var(--green))",
              opacity: restoring ? 0.6 : 1,
            }}
          >
            {restoring ? "Restoring…" : "Restore Purchases"}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PremiumScreen;

import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import LegalModal, { type LegalDoc } from "@/components/LegalModal";
import { useAuthStore } from "@/stores/authStore";
import { hapticSelection, hapticSuccess, hapticError } from "@/lib/despia";
import {
  PLANS,
  startCheckout,
  consumeCheckoutReturn,
  confirmPremiumWithBackend,
  type PlanId,
} from "@/lib/paystack";


interface PaywallDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional feature name that triggered the paywall (used in the headline). */
  feature?: string;
  /** Optional link to the full comparison screen. */
  onSeeAllFeatures?: () => void;
}

const BENEFITS = [
  { icon: "gift", text: "Baby Shower posts & peer-to-peer gifts" },
  { icon: "chatbubble-ellipses", text: "Unlimited AI health assistant" },
  { icon: "location", text: "Full Rescue Map directory" },
  { icon: "shield-checkmark", text: "Safety Net inactivity alerts" },
  { icon: "ribbon", text: "Exclusive community badges" },
];

const PaywallDrawer = ({ open, onOpenChange, feature, onSeeAllFeatures }: PaywallDrawerProps) => {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [selected, setSelected] = useState<PlanId>("yearly");
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [status, setStatus] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);

  useEffect(() => {
    if (!open) {
      setStatus(null);
      setBusy(false);
    }
  }, [open]);

  // If the mum just came back from Paystack checkout, confirm and unlock.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const result = await consumeCheckoutReturn();
      if (cancelled || !result) return;
      if (result.plan_type === "premium") {
        hapticSuccess();
        setStatus({ kind: "success", text: "Welcome to TendherMom Plus ✨" });
        if (user?.id) await fetchProfile(user.id);
        setTimeout(() => onOpenChange(false), 1200);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user?.id, fetchProfile, onOpenChange]);

  const plan = PLANS.find((p) => p.id === selected)!;

  const handleSubscribe = async () => {
    if (busy) return;
    setStatus(null);
    setBusy(true);
    hapticSelection();
    const result = await startCheckout(selected);
    if (!result.started) {
      hapticError();
      setStatus({ kind: "error", text: result.error || "Could not start the payment." });
      setBusy(false);
      return;
    }
    // Navigating to Paystack's secure checkout page.
  };

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    setStatus(null);
    const result = await confirmPremiumWithBackend(null, 1);
    setRestoring(false);
    if (result.error) {
      setStatus({ kind: "error", text: result.error });
      return;
    }
    if (result.plan_type === "premium") {
      hapticSuccess();
      setStatus({ kind: "success", text: "Plus restored ✨" });
      if (user?.id) await fetchProfile(user.id);
      setTimeout(() => onOpenChange(false), 1200);
    } else {
      setStatus({ kind: "info", text: "No active subscription found for your account." });
    }
  };



  return (
    <>
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[70]" style={{ background: "hsla(0,0%,0%,0.45)" }} />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-[71] mx-auto outline-none"
            style={{ maxWidth: 430 }}
          >
            <div
              className="rounded-t-[28px] overflow-hidden"
              style={{
                background: "hsl(var(--bg))",
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
                boxShadow: "0 -12px 48px -12px hsla(0,0%,0%,0.25)",
              }}
            >
              {/* Grabber */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-[38px] h-[5px] rounded-full" style={{ background: "hsl(var(--border))" }} />
              </div>

              {/* Header */}
              <div
                className="px-5 pt-3 pb-6"
                style={{
                  background: "linear-gradient(160deg, hsl(153 42% 22%), hsl(153 42% 33%))",
                  color: "#fff",
                  borderRadius: "24px",
                  margin: "8px 12px 0",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center"
                    style={{ background: "hsla(0,0%,100%,0.16)" }}
                  >
                    <IonIcon name="diamond" size={16} style={{ color: "#fff" }} />
                  </div>
                  <span className="text-[11px] font-sans tracking-[0.18em] uppercase opacity-80">
                    TendherMom Plus
                  </span>
                </div>
                <Drawer.Title className="text-[22px] font-serif leading-tight">
                  {feature ? `Unlock ${feature}` : "Unlock everything"}
                </Drawer.Title>
                <Drawer.Description className="text-[13px] font-sans mt-1.5 opacity-80 leading-relaxed">
                  Premium care, gifting and guidance for your whole pregnancy journey.
                </Drawer.Description>
              </div>

              <div className="px-5 pt-5 space-y-4 max-h-[62vh] overflow-y-auto no-scrollbar">
                {/* Benefits */}
                <div className="space-y-2.5">
                  {BENEFITS.map((b) => (
                    <div key={b.text} className="flex items-center gap-3">
                      <div
                        className="w-[26px] h-[26px] rounded-[9px] flex items-center justify-center flex-shrink-0"
                        style={{ background: "hsl(var(--light-green))" }}
                      >
                        <IonIcon name={b.icon} size={14} style={{ color: "hsl(var(--green))" }} />
                      </div>
                      <span className="text-[13px] font-sans" style={{ color: "hsl(var(--dark))" }}>
                        {b.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Plans */}
                <div className="space-y-2.5 pt-1">
                  {PLANS.map((p) => {
                    const active = p.id === selected;
                    return (
                      <motion.button
                        key={p.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          hapticSelection();
                          setSelected(p.id);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left"
                        style={{
                          background: active ? "hsl(var(--light-green))" : "hsl(var(--surface))",
                          border: `1.5px solid ${active ? "hsl(var(--green))" : "transparent"}`,
                          boxShadow: active ? "0 8px 24px -10px hsla(153,42%,28%,0.45)" : "none",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-[20px] h-[20px] rounded-full flex items-center justify-center"
                            style={{
                              border: `2px solid ${active ? "hsl(var(--green))" : "hsl(var(--border))"}`,
                              background: active ? "hsl(var(--green))" : "transparent",
                            }}
                          >
                            {active && <IonIcon name="checkmark" size={12} style={{ color: "#fff" }} />}
                          </div>
                          <div>
                            <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                              {p.label}
                            </p>
                            {p.tag && (
                              <span
                                className="text-[10px] font-sans font-semibold uppercase tracking-wide"
                                style={{ color: "hsl(var(--coral))" }}
                              >
                                {p.tag}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[15px] font-serif" style={{ color: "hsl(var(--dark))" }}>
                            {p.price}
                          </p>
                          <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                            {p.period}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {status && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="px-4 py-3 rounded-2xl flex items-start gap-2.5"
                      style={{
                        background:
                          status.kind === "error"
                            ? "hsl(var(--light-coral))"
                            : status.kind === "success"
                            ? "hsl(var(--light-green))"
                            : "hsl(var(--surface))",
                      }}
                    >
                      <IonIcon
                        name={
                          status.kind === "error"
                            ? "alert-circle"
                            : status.kind === "success"
                            ? "checkmark-circle"
                            : "information-circle"
                        }
                        size={18}
                        style={{
                          color: status.kind === "error" ? "hsl(var(--coral))" : "hsl(var(--green))",
                          marginTop: 1,
                        }}
                      />
                      <p className="text-[13px] font-sans leading-relaxed flex-1" style={{ color: "hsl(var(--dark))" }}>
                        {status.text}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer CTA */}
              <div className="px-5 pt-4 space-y-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubscribe}
                  disabled={busy}
                  className="w-full py-[16px] rounded-2xl text-white text-[16px] font-semibold font-sans"
                  style={{
                    background: "linear-gradient(135deg, hsl(153 42% 28%), hsl(153 42% 36%))",
                    boxShadow: "0 6px 24px -4px hsla(153, 42%, 28%, 0.4)",
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  {busy ? "Opening secure checkout…" : `Continue — ${plan.price}${plan.period}`}
                </motion.button>

                <p
                  className="text-center text-[11px] font-sans leading-relaxed px-1"
                  style={{ color: "hsl(var(--text-muted))" }}
                >
                  Secured by Paystack — card, bank transfer or USSD. Renews automatically;
                  cancel anytime from TendherMom Plus.
                </p>

                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button
                    onClick={handleRestore}
                    className="text-[12px] font-sans font-semibold"
                    style={{ color: "hsl(var(--green))" }}
                  >
                    {restoring ? "Checking…" : "I already paid"}
                  </button>

                  {onSeeAllFeatures && (
                    <>
                      <span className="text-[11px]" style={{ color: "hsl(var(--text-muted))" }}>·</span>
                      <button
                        onClick={() => {
                          onOpenChange(false);
                          onSeeAllFeatures();
                        }}
                        className="text-[12px] font-sans font-semibold"
                        style={{ color: "hsl(var(--green))" }}
                      >
                        All features
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setLegalDoc("terms")}
                    className="text-[11px] font-sans underline"
                    style={{ color: "hsl(var(--text-muted))" }}
                  >
                    Terms
                  </button>
                  <span className="text-[11px]" style={{ color: "hsl(var(--text-muted))" }}>·</span>
                  <button
                    onClick={() => setLegalDoc("privacy")}
                    className="text-[11px] font-sans underline"
                    style={{ color: "hsl(var(--text-muted))" }}
                  >
                    Privacy
                  </button>
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {legalDoc && <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />}
    </>
  );
};

export default PaywallDrawer;

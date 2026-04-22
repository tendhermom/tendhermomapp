import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import IonIcon from "@/components/IonIcon";
import InlineStatus, { type InlineStatusMsg } from "@/components/InlineStatus";

interface SafetySettingsScreenProps {
  onBack: () => void;
}

const SafetySettingsScreen = ({ onBack }: SafetySettingsScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [enabled, setEnabled] = useState<boolean>(user?.inactivity_alerts_enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<InlineStatusMsg | null>(null);

  useEffect(() => {
    setEnabled(user?.inactivity_alerts_enabled ?? true);
  }, [user?.inactivity_alerts_enabled]);

  const showStatus = (msg: InlineStatusMsg) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 3000);
  };

  const handleToggle = async (next: boolean) => {
    if (!user) return;
    setEnabled(next);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ inactivity_alerts_enabled: next })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setEnabled(!next);
      showStatus({ kind: "error", text: "Couldn't update setting. Please try again." });
      return;
    }
    await fetchProfile(user.id);
    showStatus({
      kind: "success",
      text: next
        ? "Safety net enabled — your contacts will be alerted after 48h of inactivity."
        : "Safety net disabled — only the 24h self check-in remains.",
    });
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-1">
          <IonIcon name="chevron-back-outline" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1
          className="font-serif text-[26px] tracking-[-0.01em]"
          style={{ color: "hsl(var(--dark))" }}
        >
          Safety Net
        </h1>
      </div>

      {/* Hero card with gradient */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] p-6"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--green)) 0%, hsl(var(--green)) 60%, hsl(var(--coral) / 0.85) 140%)",
          boxShadow: "0 20px 50px -20px hsl(var(--green) / 0.45)",
        }}
      >
        {/* Decorative orbs */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full"
          style={{ background: "hsl(0 0% 100% / 0.12)", filter: "blur(8px)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-12 w-40 h-40 rounded-full"
          style={{ background: "hsl(0 0% 100% / 0.08)", filter: "blur(10px)" }}
        />

        <div className="relative">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm"
            style={{ background: "hsl(0 0% 100% / 0.18)" }}
          >
            <IonIcon
              name="shield-checkmark"
              size={24}
              style={{ color: "hsl(0 0% 100%)" }}
            />
          </div>
          <p
            className="font-sans text-[11px] uppercase tracking-[0.18em] mb-1.5"
            style={{ color: "hsl(0 0% 100% / 0.75)" }}
          >
            Always watching over you
          </p>
          <h2
            className="font-serif text-[24px] leading-[1.15] tracking-[-0.01em]"
            style={{ color: "hsl(0 0% 100%)" }}
          >
            Your silent
            <br />
            safety net.
          </h2>
        </div>
      </motion.div>

      {/* Toggle card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[24px] p-5"
        style={{
          background: "white",
          boxShadow: "0 4px 24px -12px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "hsl(var(--light-green))" }}
          >
            <IonIcon
              name="pulse-outline"
              size={20}
              style={{ color: "hsl(var(--green))" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="font-sans font-semibold text-[15px] leading-tight"
              style={{ color: "hsl(var(--dark))" }}
            >
              Inactivity check-in
            </h3>
            <p
              className="text-[12px] font-sans mt-0.5"
              style={{ color: "hsl(var(--text-muted))" }}
            >
              {enabled ? "Active · monitoring quietly" : "Paused · self-pings only"}
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={handleToggle} disabled={saving} />
        </div>

        <InlineStatus status={status} spacing="mt-4" />
      </motion.div>

      {/* Timeline card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[24px] p-5"
        style={{
          background: "white",
          boxShadow: "0 4px 24px -12px rgba(0,0,0,0.08)",
        }}
      >
        <p
          className="font-sans text-[11px] uppercase tracking-[0.18em] mb-4"
          style={{ color: "hsl(var(--text-muted))" }}
        >
          How it works
        </p>

        <div className="relative">
          {/* Vertical connector line */}
          <div
            className="absolute left-[22px] top-12 bottom-12 w-px"
            style={{
              background:
                "linear-gradient(to bottom, hsl(var(--green) / 0.3), hsl(var(--coral) / 0.3))",
            }}
          />

          {/* Step 1 — 24h */}
          <div className="flex gap-4 mb-5">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 relative z-10"
              style={{
                background: "hsl(var(--light-green))",
                boxShadow: "0 0 0 4px white, 0 4px 12px -4px hsl(var(--green) / 0.4)",
              }}
            >
              <span
                className="text-[11px] font-bold font-sans"
                style={{ color: "hsl(var(--green))" }}
              >
                24h
              </span>
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h4
                  className="font-sans font-semibold text-[14px]"
                  style={{ color: "hsl(var(--dark))" }}
                >
                  We check in with you
                </h4>
                <span
                  className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "hsl(var(--light-green))",
                    color: "hsl(var(--green))",
                  }}
                >
                  Always on
                </span>
              </div>
              <p
                className="text-[12.5px] font-sans leading-relaxed"
                style={{ color: "hsl(var(--text-muted))" }}
              >
                A gentle "We miss you" notification, just for you.
              </p>
            </div>
          </div>

          {/* Step 2 — 48h */}
          <div className="flex gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 relative z-10"
              style={{
                background: "hsl(var(--coral) / 0.12)",
                boxShadow: "0 0 0 4px white, 0 4px 12px -4px hsl(var(--coral) / 0.4)",
              }}
            >
              <span
                className="text-[11px] font-bold font-sans"
                style={{ color: "hsl(var(--coral))" }}
              >
                48h
              </span>
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h4
                  className="font-sans font-semibold text-[14px]"
                  style={{ color: "hsl(var(--dark))" }}
                >
                  We alert your contacts
                </h4>
                <span
                  className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: enabled ? "hsl(var(--coral) / 0.12)" : "hsl(var(--bg))",
                    color: enabled ? "hsl(var(--coral))" : "hsl(var(--text-muted))",
                  }}
                >
                  {enabled ? "Enabled" : "Paused"}
                </span>
              </div>
              <p
                className="text-[12.5px] font-sans leading-relaxed"
                style={{ color: "hsl(var(--text-muted))" }}
              >
                A wellness-check SMS to up to 2 of your emergency contacts (primary first).
                Never medical info — just "please check on her."
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Privacy footnote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex gap-2.5 px-1"
      >
        <IonIcon
          name="lock-closed-outline"
          size={14}
          style={{ color: "hsl(var(--text-muted))", marginTop: 2, flexShrink: 0 }}
        />
        <p
          className="text-[11.5px] font-sans leading-relaxed"
          style={{ color: "hsl(var(--text-muted))" }}
        >
          Turning this off disables the 48h SMS escalation. The 24h self check-in stays on so you
          never miss a gentle reminder. See our{" "}
          <a
            href="/privacy"
            className="underline font-medium"
            style={{ color: "hsl(var(--green))" }}
          >
            Privacy Policy
          </a>{" "}
          for full details.
        </p>
      </motion.div>
    </div>
  );
};

export default SafetySettingsScreen;

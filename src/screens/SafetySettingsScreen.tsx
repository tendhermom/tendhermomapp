import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import IonIcon from "@/components/IonIcon";
import { toast } from "sonner";

interface SafetySettingsScreenProps {
  onBack: () => void;
}

const SafetySettingsScreen = ({ onBack }: SafetySettingsScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [enabled, setEnabled] = useState<boolean>(user?.inactivity_alerts_enabled ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(user?.inactivity_alerts_enabled ?? true);
  }, [user?.inactivity_alerts_enabled]);

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
      toast.error("Could not update setting");
      return;
    }
    await fetchProfile(user.id);
    toast.success(next ? "Safety net enabled" : "Safety net disabled");
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3 pt-1">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-1">
          <IonIcon name="chevron-back-outline" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>
          Safety Net
        </h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5"
        style={{ background: "white", boxShadow: "0 4px 24px -12px rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "hsl(var(--light-green))" }}
          >
            <IonIcon name="shield-checkmark-outline" size={20} style={{ color: "hsl(var(--green))" }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h2 className="font-sans font-semibold text-[15px]" style={{ color: "hsl(var(--dark))" }}>
                Inactivity check-in
              </h2>
              <Switch checked={enabled} onCheckedChange={handleToggle} disabled={saving} />
            </div>
            <p className="text-[12px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
              Your silent safety net.
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "hsl(var(--bg))" }}
        >
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "white" }}
            >
              <span className="text-[11px] font-bold font-sans" style={{ color: "hsl(var(--green))" }}>
                24h
              </span>
            </div>
            <div>
              <p className="text-[13px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                We check in with you
              </p>
              <p className="text-[12px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
                A gentle "We miss you" notification, just for you. Always on.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "white" }}
            >
              <span className="text-[11px] font-bold font-sans" style={{ color: "hsl(var(--coral))" }}>
                48h
              </span>
            </div>
            <div>
              <p className="text-[13px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                We alert your contacts
              </p>
              <p className="text-[12px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
                A wellness-check SMS to up to 2 of your emergency contacts (primary first).
                Never medical info — just "please check on her."
              </p>
            </div>
          </div>
        </div>

        <p
          className="text-[11px] font-sans leading-relaxed mt-4"
          style={{ color: "hsl(var(--text-muted))" }}
        >
          Turning this off disables the 48h SMS escalation. The 24h self check-in stays on so you
          never miss a gentle reminder. See our{" "}
          <a href="/privacy" className="underline" style={{ color: "hsl(var(--green))" }}>
            Privacy Policy
          </a>{" "}
          for full details.
        </p>
      </motion.div>
    </div>
  );
};

export default SafetySettingsScreen;

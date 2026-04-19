import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import IonIcon from "@/components/IonIcon";
import { toast } from "sonner";

const PHONE_REGEX = /^\+234[0-9]{10}$/;
const SKIP_KEY = "phone_backfill_skipped_at";
const SKIP_COOLDOWN_DAYS = 7;

/**
 * One-time prompt for users who signed up before phone capture was added at signup.
 * Shows once per 7-day window if they skip; never again after they save.
 */
const PhoneBackfillPrompt = () => {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.phone && PHONE_REGEX.test(user.phone)) return;

    const skippedAt = localStorage.getItem(SKIP_KEY);
    if (skippedAt) {
      const ageDays = (Date.now() - Number(skippedAt)) / (1000 * 60 * 60 * 24);
      if (ageDays < SKIP_COOLDOWN_DAYS) return;
    }

    // Wait briefly so the prompt doesn't fight splash/intro.
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [user?.id, user?.phone]);

  const handleSkip = () => {
    localStorage.setItem(SKIP_KEY, String(Date.now()));
    setOpen(false);
  };

  const handleSave = async () => {
    if (!user) return;
    const clean = phone.replace(/\s/g, "");
    if (!PHONE_REGEX.test(clean)) {
      toast.error("Please enter a valid Nigerian number (+234XXXXXXXXXX)");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ phone: clean })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save your number");
      return;
    }
    await fetchProfile(user.id);
    localStorage.removeItem(SKIP_KEY);
    toast.success("Phone number saved");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          style={{ background: "rgba(15,23,42,0.55)" }}
          onClick={handleSkip}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] mx-4 mb-4 sm:mb-0 rounded-3xl p-6"
            style={{
              background: "white",
              paddingBottom: "calc(24px + var(--safe-area-bottom, 0px))",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "hsl(var(--light-green))" }}
            >
              <IonIcon name="call-outline" size={22} style={{ color: "hsl(var(--green))" }} />
            </div>
            <h2
              className="font-serif text-[20px] leading-tight mb-2"
              style={{ color: "hsl(var(--dark))" }}
            >
              Add your phone number
            </h2>
            <p
              className="text-[13px] font-sans leading-relaxed mb-4"
              style={{ color: "hsl(var(--text-muted))" }}
            >
              We use this only to power your safety net — never marketing.
            </p>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234XXXXXXXXXX"
              maxLength={20}
              className="w-full px-4 py-3.5 rounded-2xl text-[15px] font-sans outline-none mb-4"
              style={{
                background: "hsl(var(--surface))",
                color: "hsl(var(--dark))",
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSkip}
                className="flex-1 py-3 rounded-2xl text-[14px] font-sans font-medium"
                style={{ background: "hsl(var(--bg))", color: "hsl(var(--text-muted))" }}
              >
                Not now
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl text-[14px] font-semibold text-white disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 22%))",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhoneBackfillPrompt;

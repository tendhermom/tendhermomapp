import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import IonIcon from "@/components/IonIcon";
import { toast } from "sonner";

interface ExpertOnboardingScreenProps {
  onComplete: () => void;
}

const SPECIALTIES = [
  { key: "Gynaecology", icon: "female-outline", desc: "Women's reproductive health" },
  { key: "Obstetrics", icon: "body-outline", desc: "Pregnancy & delivery care" },
  { key: "Midwifery", icon: "heart-outline", desc: "Birth & postnatal support" },
  { key: "Pediatrics", icon: "happy-outline", desc: "Newborn & child health" },
  { key: "Nutrition", icon: "nutrition-outline", desc: "Maternal & baby nutrition" },
  { key: "Mental Health", icon: "leaf-outline", desc: "Emotional wellbeing" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const ExpertOnboardingScreen = ({ onComplete }: ExpertOnboardingScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [step, setStep] = useState(0); // 0=welcome, 1=specialty, 2=bio
  const [direction, setDirection] = useState(1);
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const goNext = useCallback(() => { setDirection(1); setStep((s) => s + 1); }, []);
  const goBack = useCallback(() => { setDirection(-1); setStep((s) => s - 1); }, []);

  const handleFinish = async () => {
    if (!user || !specialty) return;
    setSaving(true);

    // Insert into doctors table
    const { error: docErr } = await supabase.from("doctors").insert({
      id: user.id,
      full_name: user.full_name,
      specialty,
      bio: bio.trim() || null,
      avatar_url: user.avatar_url,
      is_active: true,
    });

    if (docErr && !docErr.message.includes("duplicate")) {
      toast.error("Failed to set up your profile. Please try again.");
      setSaving(false);
      return;
    }

    localStorage.setItem("onboarding_completed", "true");
    await fetchProfile(user.id);
    setSaving(false);
    onComplete();
  };

  const renderWelcome = () => (
    <div className="flex flex-col items-center text-center h-full justify-between py-6">
      <div />
      <div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-[80px] h-[80px] rounded-[22px] flex items-center justify-center mx-auto mb-6"
          style={{
            background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 22%))",
            boxShadow: "0 8px 32px -8px hsla(153,42%,30%,0.5)",
          }}
        >
          <IonIcon name="medkit" size={36} style={{ color: "white" }} />
        </motion.div>

        <h1 className="font-serif text-[28px] leading-tight mb-2" style={{ color: "hsl(var(--dark))" }}>
          Welcome, Expert!
        </h1>
        <p className="text-[14px] font-sans leading-relaxed mb-8 max-w-[300px] mx-auto" style={{ color: "hsl(var(--text-muted))" }}>
          Set up your profile so mothers can book consultations with you.
        </p>

        <div className="space-y-3 w-full max-w-[320px] mx-auto text-left">
          {[
            { icon: "calendar-outline", title: "Manage Availability", desc: "Set your consultation hours and dates", color: "hsl(var(--green))", bg: "hsl(var(--light-green))" },
            { icon: "people-outline", title: "Accept Bookings", desc: "Mothers book 15-min sessions with you", color: "hsl(var(--green))", bg: "hsl(var(--light-green))" },
            { icon: "notifications-outline", title: "Get Notified", desc: "Receive alerts when sessions are booked", color: "hsl(var(--coral))", bg: "hsl(var(--light-coral))" },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 300, damping: 28 }}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: f.bg }}
            >
              <div className="w-[40px] h-[40px] rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <IonIcon name={f.icon} size={20} style={{ color: f.color }} />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>{f.title}</h4>
                <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={goNext}
        className="w-full max-w-[320px] py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans"
        style={{
          background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 24%))",
          boxShadow: "0 4px 20px -4px hsla(153,42%,30%,0.4)",
        }}
      >
        Set Up Profile
      </motion.button>
    </div>
  );

  const renderSpecialty = () => (
    <div className="flex flex-col h-full justify-between py-6">
      <div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={goBack} className="flex items-center gap-1 mb-6">
          <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--green))" }} />
          <span className="text-[14px] font-sans font-medium" style={{ color: "hsl(var(--green))" }}>Back</span>
        </motion.button>

        <h1 className="font-serif text-[26px] leading-tight mb-2" style={{ color: "hsl(var(--dark))" }}>
          Your specialty
        </h1>
        <p className="text-[14px] font-sans mb-6" style={{ color: "hsl(var(--text-muted))" }}>
          Select the area you practice in.
        </p>

        <div className="space-y-2.5">
          {SPECIALTIES.map((s) => (
            <motion.button
              key={s.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSpecialty(s.key)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
              style={{
                background: specialty === s.key ? "hsl(var(--light-green))" : "hsl(var(--surface))",
                border: `2px solid ${specialty === s.key ? "hsl(var(--green))" : "transparent"}`,
              }}
            >
              <div className="w-[40px] h-[40px] rounded-xl flex items-center justify-center shrink-0"
                style={{ background: specialty === s.key ? "hsl(var(--green))" : "hsl(var(--bg))" }}>
                <IonIcon name={s.icon} size={20} style={{ color: specialty === s.key ? "white" : "hsl(var(--text-muted))" }} />
              </div>
              <div>
                <h4 className="text-[14px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>{s.key}</h4>
                <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{s.desc}</p>
              </div>
              {specialty === s.key && (
                <IonIcon name="checkmark-circle" size={22} style={{ color: "hsl(var(--green))", marginLeft: "auto" }} />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={goNext}
        disabled={!specialty}
        className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans disabled:opacity-50 mt-6"
        style={{
          background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 24%))",
          boxShadow: "0 4px 20px -4px hsla(153,42%,30%,0.4)",
        }}
      >
        Continue
      </motion.button>
    </div>
  );

  const renderBio = () => (
    <div className="flex flex-col h-full justify-between py-6">
      <div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={goBack} className="flex items-center gap-1 mb-6">
          <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--green))" }} />
          <span className="text-[14px] font-sans font-medium" style={{ color: "hsl(var(--green))" }}>Back</span>
        </motion.button>

        <h1 className="font-serif text-[26px] leading-tight mb-2" style={{ color: "hsl(var(--dark))" }}>
          About you
        </h1>
        <p className="text-[14px] font-sans mb-6" style={{ color: "hsl(var(--text-muted))" }}>
          Write a short bio so mothers know your background.
        </p>

        <div className="tend-card p-5 space-y-4">
          <div>
            <label className="text-[13px] font-semibold font-sans mb-2 block" style={{ color: "hsl(var(--dark))" }}>
              Professional Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. 10+ years of experience in obstetrics at Lagos University Teaching Hospital..."
              maxLength={500}
              rows={5}
              className="w-full px-4 py-3.5 rounded-2xl text-[14px] font-sans outline-none resize-none"
              style={{
                background: "hsl(var(--bg))",
                color: "hsl(var(--dark))",
                border: "1.5px solid hsl(var(--border-subtle))",
              }}
            />
            <p className="text-[11px] font-sans mt-1 text-right" style={{ color: "hsl(var(--text-muted))" }}>
              {bio.length}/500
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 flex items-start gap-2"
            style={{ background: "hsl(var(--light-green))" }}
          >
            <IonIcon name="information-circle-outline" size={16} style={{ color: "hsl(var(--green))", marginTop: 2, flexShrink: 0 }} />
            <p className="text-[12px] font-sans leading-relaxed" style={{ color: "hsl(var(--green))" }}>
              You'll be listed as <strong>{specialty}</strong> specialist. You can update your bio and availability anytime from your dashboard.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="space-y-3 mt-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleFinish}
          disabled={saving}
          className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 24%))",
            boxShadow: "0 4px 20px -4px hsla(153,42%,30%,0.4)",
          }}
        >
          {saving ? "Setting up…" : "Complete Setup"}
        </motion.button>
        <button
          onClick={() => { localStorage.setItem("onboarding_completed", "true"); onComplete(); }}
          className="w-full py-3 text-[14px] font-sans font-medium"
          style={{ color: "hsl(var(--text-muted))" }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );

  const steps = [renderWelcome, renderSpecialty, renderBio];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--bg))" }}>
      <div className="flex-1 px-6 max-w-[430px] mx-auto w-full flex flex-col"
        style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 12px)" }}>
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 24 : 8,
                background: i === step ? "hsl(var(--green))" : "hsl(var(--border-subtle))",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="h-[8px] rounded-full"
            />
          ))}
        </div>
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full"
            >
              {steps[step]()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ExpertOnboardingScreen;

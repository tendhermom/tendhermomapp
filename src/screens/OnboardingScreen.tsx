import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import IonIcon from "@/components/IonIcon";
import { toast } from "sonner";
import { addDays } from "date-fns";
import logo from "@/assets/logo.jpeg";

interface OnboardingScreenProps {
  onComplete: () => void;
}

/* ─── Step Data ─── */
const FEATURES = [
  {
    icon: "pulse-outline",
    title: "Symptom Triage",
    desc: "Check symptoms anytime and get guidance reviewed by Nigerian clinicians.",
    color: "hsl(var(--green))",
    bg: "hsl(var(--light-green))",
  },
  {
    icon: "warning-outline",
    title: "SOS Emergency",
    desc: "One-tap alert sends your GPS to emergency contacts via SMS & WhatsApp.",
    color: "hsl(var(--coral))",
    bg: "hsl(var(--light-coral))",
  },
  {
    icon: "chatbubbles-outline",
    title: "Community",
    desc: "Connect with mothers in your trimester for support and advice.",
    color: "hsl(var(--green))",
    bg: "hsl(var(--light-green))",
  },
];

const PHONE_REGEX = /^\+234[0-9]{10}$/;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [step, setStep] = useState(0); // 0=welcome, 1=LMP, 2=contact
  const [direction, setDirection] = useState(1);

  // LMP state
  const [lmpDate, setLmpDate] = useState("");
  const [savingLmp, setSavingLmp] = useState(false);

  // Contact state
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRelationship, setContactRelationship] = useState("Husband");
  const [savingContact, setSavingContact] = useState(false);
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => s + 1);
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => s - 1);
  }, []);

  const computeDueDate = (lmp: string) => {
    const lmpObj = new Date(lmp);
    return addDays(lmpObj, 280).toISOString().split("T")[0];
  };

  const computeStage = (lmp: string): "first_trimester" | "second_trimester" | "third_trimester" | "postpartum" => {
    const weeks = Math.floor((Date.now() - new Date(lmp).getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (weeks <= 13) return "first_trimester";
    if (weeks <= 26) return "second_trimester";
    if (weeks <= 42) return "third_trimester";
    return "postpartum";
  };

  /* ─── Save LMP ─── */
  const handleSaveLmp = async () => {
    if (!lmpDate || !user) return;
    setSavingLmp(true);
    const dueDate = computeDueDate(lmpDate);
    const stage = computeStage(lmpDate);

    const { error } = await supabase
      .from("profiles")
      .update({ lmp_date: lmpDate, due_date: dueDate, current_stage: stage })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to save. Please try again.");
    } else {
      await fetchProfile(user.id);
      goNext();
    }
    setSavingLmp(false);
  };

  /* ─── Save Contact ─── */
  const handleSaveContact = async () => {
    if (!user) return;
    const errs: Record<string, string> = {};
    if (!contactName.trim()) errs.name = "Name is required";
    if (!contactPhone.trim()) errs.phone = "Phone is required";
    else if (!PHONE_REGEX.test(contactPhone.replace(/\s/g, "")))
      errs.phone = "Enter +234XXXXXXXXXX";
    setContactErrors(errs);
    if (Object.keys(errs).length) return;

    setSavingContact(true);
    const { error } = await supabase.from("emergency_contacts").insert({
      user_id: user.id,
      name: contactName.trim(),
      phone: contactPhone.replace(/\s/g, ""),
      relationship: contactRelationship,
      is_primary: true,
      sms_enabled: true,
      whatsapp_enabled: true,
    });

    if (error) {
      toast.error("Failed to save contact");
    } else {
      finishOnboarding();
    }
    setSavingContact(false);
  };

  const finishOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    onComplete();
  };

  /* ─── STEP 0: Welcome Tour ─── */
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
            background: "linear-gradient(135deg, hsl(153 42% 30%), hsl(153 42% 22%))",
            boxShadow: "0 8px 32px -8px hsla(153,42%,30%,0.5)",
          }}
        >
          <IonIcon name="heart" size={36} style={{ color: "white" }} />
        </motion.div>

        <h1
          className="font-serif text-[28px] leading-tight mb-2"
          style={{ color: "hsl(var(--dark))" }}
        >
          Welcome to TendherMom
        </h1>
        <p
          className="text-[14px] font-sans leading-relaxed mb-8 max-w-[280px] mx-auto"
          style={{ color: "hsl(var(--text-muted))" }}
        >
          Your maternal health companion — built for Nigerian mothers.
        </p>

        <div className="space-y-3 w-full max-w-[320px] mx-auto text-left">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 300, damping: 28 }}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: f.bg }}
            >
              <div
                className="w-[40px] h-[40px] rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <IonIcon name={f.icon} size={20} style={{ color: f.color }} />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
                  {f.title}
                </h4>
                <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                  {f.desc}
                </p>
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
        Get Started
      </motion.button>
    </div>
  );

  /* ─── STEP 1: LMP Entry ─── */
  const renderLmp = () => {
    const duePreview = lmpDate ? computeDueDate(lmpDate) : null;
    const weeksPreview = lmpDate
      ? Math.max(1, Math.floor((Date.now() - new Date(lmpDate).getTime()) / (7 * 24 * 60 * 60 * 1000)))
      : null;

    return (
      <div className="flex flex-col h-full justify-between py-6">
        <div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={goBack}
            className="flex items-center gap-1 mb-6"
          >
            <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--green))" }} />
            <span className="text-[14px] font-sans font-medium" style={{ color: "hsl(var(--green))" }}>Back</span>
          </motion.button>

          <h1 className="font-serif text-[26px] leading-tight mb-2" style={{ color: "hsl(var(--dark))" }}>
            When was your last period?
          </h1>
          <p className="text-[14px] font-sans mb-6" style={{ color: "hsl(var(--text-muted))" }}>
            We'll calculate your due date and trimester from this.
          </p>

          <div className="tend-card p-5 space-y-4">
            <div>
              <label
                className="text-[13px] font-semibold font-sans mb-2 block"
                style={{ color: "hsl(var(--dark))" }}
                aria-label="Last Menstrual Period date"
              >
                Last Menstrual Period (LMP)
              </label>
              <input
                type="date"
                value={lmpDate}
                onChange={(e) => setLmpDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3.5 rounded-2xl text-[15px] font-sans outline-none"
                style={{
                  background: "hsl(var(--bg))",
                  color: "hsl(var(--dark))",
                  border: "1.5px solid hsl(var(--border-subtle))",
                }}
                aria-label="Select your last menstrual period date"
              />
            </div>

            {duePreview && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4"
                style={{ background: "hsl(var(--light-green))" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <IonIcon name="calendar" size={16} style={{ color: "hsl(var(--green))" }} />
                  <span className="text-[12px] font-sans font-bold uppercase tracking-wider" style={{ color: "hsl(var(--green))" }}>
                    Your Estimate
                  </span>
                </div>
                <p className="text-[14px] font-sans" style={{ color: "hsl(var(--dark))" }}>
                  <strong>Due date:</strong>{" "}
                  {new Date(duePreview).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <p className="text-[13px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                  You're currently at <strong>week {weeksPreview}</strong>
                </p>
              </motion.div>
            )}
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveLmp}
            disabled={!lmpDate || savingLmp}
            className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 24%))",
              boxShadow: "0 4px 20px -4px hsla(153,42%,30%,0.4)",
            }}
          >
            {savingLmp ? "Saving…" : "Continue"}
          </motion.button>
          <p className="text-[12px] font-sans text-center px-4" style={{ color: "hsl(var(--text-muted))" }}>
            Your LMP powers your due date, weekly insights, and antenatal timeline — it's required to continue.
          </p>
        </div>
      </div>
    );
  };

  /* ─── STEP 2: Emergency Contact ─── */
  const renderContact = () => (
    <div className="flex flex-col h-full justify-between py-6">
      <div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goBack}
          className="flex items-center gap-1 mb-6"
        >
          <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--green))" }} />
          <span className="text-[14px] font-sans font-medium" style={{ color: "hsl(var(--green))" }}>Back</span>
        </motion.button>

        <h1 className="font-serif text-[26px] leading-tight mb-2" style={{ color: "hsl(var(--dark))" }}>
          Add an emergency contact
        </h1>
        <p className="text-[14px] font-sans mb-6" style={{ color: "hsl(var(--text-muted))" }}>
          This person will be alerted when you trigger SOS.
        </p>

        <div className="tend-card p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
              Full Name
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Chidi Okafor"
              className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
              style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
              aria-label="Emergency contact full name"
            />
            {contactErrors.name && (
              <p className="text-[12px] font-sans mt-1" style={{ color: "hsl(var(--coral))" }}>{contactErrors.name}</p>
            )}
          </div>

          {/* Relationship */}
          <div>
            <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
              Relationship
            </label>
            <div className="flex flex-wrap gap-2">
              {["Husband", "Mother", "Sister", "Friend", "Brother", "Other"].map((r) => (
                <motion.button
                  key={r}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setContactRelationship(r)}
                  className="px-3 py-1.5 rounded-full text-[13px] font-sans font-medium"
                  style={{
                    background: contactRelationship === r ? "hsl(var(--green))" : "hsl(var(--bg))",
                    color: contactRelationship === r ? "white" : "hsl(var(--dark))",
                  }}
                  aria-label={`Select relationship: ${r}`}
                  aria-pressed={contactRelationship === r}
                >
                  {r}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+234XXXXXXXXXX"
              className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
              style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
              aria-label="Emergency contact phone number"
            />
            {contactErrors.phone && (
              <p className="text-[12px] font-sans mt-1" style={{ color: "hsl(var(--coral))" }}>{contactErrors.phone}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 mt-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSaveContact}
          disabled={savingContact}
          className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 24%))",
            boxShadow: "0 4px 20px -4px hsla(153,42%,30%,0.4)",
          }}
        >
          {savingContact ? "Saving…" : "Save & Finish"}
        </motion.button>
        <button
          onClick={finishOnboarding}
          className="w-full py-3 text-[14px] font-sans font-medium"
          style={{ color: "hsl(var(--text-muted))" }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );

  /* ─── Step Progress Dots ─── */
  const renderDots = () => (
    <div className="flex items-center justify-center gap-2 pt-4" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={3}>
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
  );

  const steps = [renderWelcome, renderLmp, renderContact];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "hsl(var(--bg))" }}
    >
      <div className="flex-1 px-6 max-w-[430px] mx-auto w-full flex flex-col"
        style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 12px)" }}
      >
        {renderDots()}
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

export default OnboardingScreen;

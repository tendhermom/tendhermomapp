import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import IonIcon from "@/components/IonIcon";
import { toast } from "sonner";

const STAGES = [
  { value: "first_trimester", label: "First Trimester", desc: "Weeks 1–12", icon: "leaf-outline" },
  { value: "second_trimester", label: "Second Trimester", desc: "Weeks 13–26", icon: "flower-outline" },
  { value: "third_trimester", label: "Third Trimester", desc: "Weeks 27–40", icon: "heart-outline" },
  { value: "postpartum", label: "Postpartum", desc: "Baby is here!", icon: "happy-outline" },
] as const;

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [step, setStep] = useState(0);
  const [babyName, setBabyName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lmpDate, setLmpDate] = useState("");
  const [stage, setStage] = useState<string>("first_trimester");
  const [saving, setSaving] = useState(false);
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const steps = [
    { title: "What should we call\nyour little one?", subtitle: "A nickname is fine too ✨" },
    { title: "When is your\ndue date?", subtitle: "We'll personalise your timeline" },
    { title: "When was your last\nmenstrual period?", subtitle: "Helps us calculate your week" },
    { title: "What stage are\nyou in?", subtitle: "We'll tailor content for you" },
  ];

  const canNext = () => {
    if (step === 0) return true; // baby name is optional
    if (step === 1) return true; // due date optional
    if (step === 2) return true; // lmp optional
    if (step === 3) return !!stage;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    const updates: Record<string, unknown> = {
      current_stage: stage,
    };
    if (babyName.trim()) updates.baby_name = babyName.trim();
    if (dueDate) updates.due_date = dueDate;
    if (lmpDate) updates.lmp_date = lmpDate;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to save. Please try again.");
      setSaving(false);
      return;
    }

    await fetchProfile(user.id);
    setSaving(false);
    onComplete();
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const progress = ((step + 1) / 4) * 100;

  return (
    <div className="min-h-screen flex justify-center" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-[430px] px-6 pt-14 pb-8 flex flex-col">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-2">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="p-1 -ml-1">
              <IonIcon name="chevron-back-outline" size={22} style={{ color: "hsl(var(--dark))" }} />
            </button>
          )}
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border-subtle))" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "hsl(var(--green))" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <button
            onClick={handleNext}
            className="text-[13px] font-sans font-medium"
            style={{ color: "hsl(var(--text-muted))" }}
          >
            Skip
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h1
                className="font-serif text-[28px] leading-tight whitespace-pre-line mb-2"
                style={{ color: "hsl(var(--dark))" }}
              >
                {steps[step].title}
              </h1>
              <p className="text-[14px] font-sans mb-8" style={{ color: "hsl(var(--text-muted))" }}>
                {steps[step].subtitle}
              </p>

              {/* Step 0: Baby name */}
              {step === 0 && (
                <input
                  type="text"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder="e.g. Baby Ife, Peanut…"
                  maxLength={50}
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl text-[16px] font-sans outline-none"
                  style={{
                    background: "hsl(var(--surface))",
                    color: "hsl(var(--dark))",
                    border: "1.5px solid hsl(var(--border-subtle))",
                  }}
                />
              )}

              {/* Step 1: Due date */}
              {step === 1 && (
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl text-[16px] font-sans outline-none"
                  style={{
                    background: "hsl(var(--surface))",
                    color: "hsl(var(--dark))",
                    border: "1.5px solid hsl(var(--border-subtle))",
                  }}
                />
              )}

              {/* Step 2: LMP date */}
              {step === 2 && (
                <input
                  type="date"
                  value={lmpDate}
                  onChange={(e) => setLmpDate(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl text-[16px] font-sans outline-none"
                  style={{
                    background: "hsl(var(--surface))",
                    color: "hsl(var(--dark))",
                    border: "1.5px solid hsl(var(--border-subtle))",
                  }}
                />
              )}

              {/* Step 3: Pregnancy stage */}
              {step === 3 && (
                <div className="space-y-3">
                  {STAGES.map((s) => (
                    <motion.button
                      key={s.value}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setStage(s.value)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-colors"
                      style={{
                        background: stage === s.value ? "hsl(var(--light-green))" : "hsl(var(--surface))",
                        border: `1.5px solid ${stage === s.value ? "hsl(var(--green))" : "hsl(var(--border-subtle))"}`,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: stage === s.value ? "hsl(var(--green))" : "hsl(var(--light-green))",
                        }}
                      >
                        <IonIcon
                          name={s.icon}
                          size={20}
                          style={{
                            color: stage === s.value ? "white" : "hsl(var(--green))",
                          }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-[15px] font-sans font-semibold"
                          style={{ color: "hsl(var(--dark))" }}
                        >
                          {s.label}
                        </p>
                        <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                          {s.desc}
                        </p>
                      </div>
                      {stage === s.value && (
                        <IonIcon
                          name="checkmark-circle"
                          size={22}
                          style={{ color: "hsl(var(--green))", marginLeft: "auto" }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          disabled={!canNext() || saving}
          className="w-full py-3.5 rounded-2xl text-[15px] font-semibold font-sans flex items-center justify-center gap-2"
          style={{
            background: "hsl(var(--green))",
            color: "white",
            opacity: !canNext() || saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : step < 3 ? "Continue" : "Let's go! 🎉"}
        </motion.button>
      </div>
    </div>
  );
};

export default OnboardingScreen;

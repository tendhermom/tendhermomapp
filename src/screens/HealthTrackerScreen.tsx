import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import SmartGuidance from "@/components/health/SmartGuidance";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HealthTrackerScreenProps {
  onNavigate: (screen: string) => void;
}

interface HealthEntry {
  id: string;
  date: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  weight?: number;
  notes?: string;
}

const BABY_MILESTONES = [
  { week: 4, size: "Poppy seed", length: "0.1 cm", detail: "Heart begins to form" },
  { week: 8, size: "Raspberry", length: "1.6 cm", detail: "Tiny fingers forming" },
  { week: 12, size: "Lime", length: "5.4 cm", detail: "Reflexes developing" },
  { week: 16, size: "Avocado", length: "11.6 cm", detail: "Can make facial expressions" },
  { week: 20, size: "Banana", length: "16.5 cm", detail: "You may feel kicks!" },
  { week: 24, size: "Corn cob", length: "30 cm", detail: "Lungs developing" },
  { week: 28, size: "Aubergine", length: "37.6 cm", detail: "Eyes can open and close" },
  { week: 32, size: "Squash", length: "42.4 cm", detail: "Practising breathing" },
  { week: 36, size: "Honeydew", length: "47.4 cm", detail: "Almost ready!" },
  { week: 40, size: "Watermelon", length: "51.2 cm", detail: "Ready to meet you!" },
];

const HEALTH_TIPS = [
  { icon: "water-outline", tip: "Drink at least 8 glasses of water daily", color: "green" },
  { icon: "nutrition-outline", tip: "Include iron-rich foods like spinach & beans", color: "coral" },
  { icon: "walk-outline", tip: "30 minutes of gentle walking is recommended", color: "green" },
  { icon: "moon-outline", tip: "Aim for 7-9 hours of sleep", color: "coral" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const HealthTrackerScreen = ({ onNavigate }: HealthTrackerScreenProps) => {
  const currentWeek = useAuthStore((s) => s.getCurrentWeek());
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<"mom" | "baby">("mom");
  const [showInput, setShowInput] = useState(false);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [weight, setWeight] = useState("");
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("health_metrics" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(20);
    if (data && !error) {
      setEntries((data as any[]).map((d) => ({
        id: d.id,
        date: new Date(d.recorded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        systolic: d.systolic ?? undefined,
        diastolic: d.diastolic ?? undefined,
        heartRate: d.heart_rate ?? undefined,
        weight: d.weight ? parseFloat(d.weight) : undefined,
        notes: d.notes ?? undefined,
      })));
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const currentMilestone = BABY_MILESTONES.reduce((prev, curr) =>
    currentWeek >= curr.week ? curr : prev, BABY_MILESTONES[0]
  );

  const nextMilestone = BABY_MILESTONES.find((m) => m.week > currentWeek);

  const handleSaveEntry = async () => {
    if (!systolic && !diastolic && !heartRate && !weight) return;
    if (!user?.id) return;

    const payload: any = { user_id: user.id };
    if (systolic) payload.systolic = parseInt(systolic);
    if (diastolic) payload.diastolic = parseInt(diastolic);
    if (heartRate) payload.heart_rate = parseInt(heartRate);
    if (weight) payload.weight = parseFloat(weight);

    const { error } = await supabase.from("health_metrics" as any).insert(payload);
    if (error) {
      toast.error("Failed to save entry");
      return;
    }

    toast.success("Health metrics saved!");
    setSystolic(""); setDiastolic(""); setHeartRate(""); setWeight("");
    setShowInput(false);
    fetchEntries();

    if (systolic && parseInt(systolic) > 140) {
      toast.warning("Your blood pressure is elevated — please consult your doctor.");
    }
  };

  const getBPStatus = (sys?: number, dia?: number) => {
    if (!sys || !dia) return null;
    if (sys >= 140 || dia >= 90) return { label: "High — See your doctor", color: "hsl(var(--coral))", bg: "hsl(var(--light-coral))" };
    if (sys >= 120 || dia >= 80) return { label: "Elevated — Monitor closely", color: "hsl(45 93% 45%)", bg: "hsl(45 93% 92%)" };
    return { label: "Normal — Looking good!", color: "hsl(var(--green))", bg: "hsl(var(--light-green))" };
  };

  return (
    <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <button onClick={() => onNavigate("home")} className="ios-press">
          <IonIcon name="arrow-back" size={22} style={{ color: "hsl(var(--dark))" }} />
        </button>
        <h1 className="text-[24px] font-serif" style={{ color: "hsl(var(--dark))" }}>Health Tracker</h1>
      </motion.div>

      {/* Tab Toggle */}
      <motion.div variants={fadeUp} className="flex gap-2">
        {(["mom", "baby"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 rounded-[14px] text-[13px] font-sans font-semibold transition-all"
            style={{
              background: activeTab === tab
                ? (tab === "mom" ? "hsl(var(--coral))" : "hsl(var(--green))")
                : "hsl(var(--surface))",
              color: activeTab === tab ? "white" : "hsl(var(--text-muted))",
              boxShadow: activeTab === tab ? "0 4px 16px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            {tab === "mom" ? "Mother's Health" : "Baby's Growth"}
          </button>
        ))}
      </motion.div>

      {activeTab === "mom" ? (
        <>
          {/* Quick Stats */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
            <div className="tend-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--light-coral))" }}>
                  <IonIcon name="heart-outline" size={16} style={{ color: "hsl(var(--coral))" }} />
                </div>
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>
                  Blood Pressure
                </span>
              </div>
              <p className="text-[22px] font-serif" style={{ color: "hsl(var(--dark))" }}>
                {entries[0]?.systolic ? `${entries[0].systolic}/${entries[0].diastolic}` : "—/—"}
              </p>
              {entries[0]?.systolic && (() => {
                const status = getBPStatus(entries[0].systolic, entries[0].diastolic);
                return status ? (
                  <span className="text-[9px] font-sans font-semibold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                ) : null;
              })()}
            </div>
            <div className="tend-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--light-green))" }}>
                  <IonIcon name="pulse-outline" size={16} style={{ color: "hsl(var(--green))" }} />
                </div>
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>
                  Heart Rate
                </span>
              </div>
              <p className="text-[22px] font-serif" style={{ color: "hsl(var(--dark))" }}>
                {entries[0]?.heartRate ? `${entries[0].heartRate}` : "—"} <span className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>bpm</span>
              </p>
            </div>
          </motion.div>

          {/* Add Entry */}
          <motion.div variants={fadeUp}>
            <AnimatePresence>
              {showInput ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="tend-card p-4 space-y-3 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>Log Today's Metrics</h3>
                    <button onClick={() => setShowInput(false)} className="ios-press">
                      <IonIcon name="close" size={18} style={{ color: "hsl(var(--text-muted))" }} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-sans font-semibold uppercase tracking-wider mb-1 block" style={{ color: "hsl(var(--text-muted))" }}>Systolic</label>
                      <input type="number" value={systolic} onChange={(e) => setSystolic(e.target.value)} placeholder="120"
                        className="w-full px-3 py-2 rounded-[10px] text-[14px] font-sans outline-none"
                        style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))", border: "1px solid hsl(var(--border-subtle))" }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-sans font-semibold uppercase tracking-wider mb-1 block" style={{ color: "hsl(var(--text-muted))" }}>Diastolic</label>
                      <input type="number" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} placeholder="80"
                        className="w-full px-3 py-2 rounded-[10px] text-[14px] font-sans outline-none"
                        style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))", border: "1px solid hsl(var(--border-subtle))" }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-sans font-semibold uppercase tracking-wider mb-1 block" style={{ color: "hsl(var(--text-muted))" }}>Heart Rate</label>
                      <input type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} placeholder="75"
                        className="w-full px-3 py-2 rounded-[10px] text-[14px] font-sans outline-none"
                        style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))", border: "1px solid hsl(var(--border-subtle))" }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-sans font-semibold uppercase tracking-wider mb-1 block" style={{ color: "hsl(var(--text-muted))" }}>Weight (kg)</label>
                      <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65"
                        className="w-full px-3 py-2 rounded-[10px] text-[14px] font-sans outline-none"
                        style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))", border: "1px solid hsl(var(--border-subtle))" }} />
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveEntry}
                    className="w-full py-3 rounded-[14px] text-[14px] font-sans font-semibold ios-press"
                    style={{ background: "hsl(var(--green))", color: "white" }}>
                    Save Entry
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowInput(true)}
                  className="w-full tend-card p-4 flex items-center gap-3 ios-press"
                >
                  <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center" style={{ background: "hsl(var(--light-green))" }}>
                    <IonIcon name="add" size={20} style={{ color: "hsl(var(--green))" }} />
                  </div>
                  <span className="text-[14px] font-sans font-medium" style={{ color: "hsl(var(--green))" }}>Log Today's Health Metrics</span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Recent Entries */}
          {entries.length > 0 && (
            <motion.div variants={fadeUp}>
              <p className="label-caps text-text-muted mb-2">RECENT ENTRIES</p>
              <div className="tend-card overflow-hidden">
                {entries.slice(0, 5).map((entry, i) => (
                  <div key={entry.id} className="flex items-center px-4 py-3 gap-3" style={{ borderBottom: i < Math.min(entries.length, 5) - 1 ? "1px solid hsl(var(--border-subtle))" : "none" }}>
                    <span className="text-[11px] font-sans font-medium w-[40px]" style={{ color: "hsl(var(--text-muted))" }}>{entry.date}</span>
                    <div className="flex-1 flex items-center gap-3">
                      {entry.systolic && (
                        <span className="text-[12px] font-sans font-semibold" style={{ color: "hsl(var(--coral))" }}>
                          {entry.systolic}/{entry.diastolic} mmHg
                        </span>
                      )}
                      {entry.heartRate && (
                        <span className="text-[12px] font-sans font-semibold" style={{ color: "hsl(var(--green))" }}>
                          {entry.heartRate} bpm
                        </span>
                      )}
                      {entry.weight && (
                        <span className="text-[12px] font-sans font-medium" style={{ color: "hsl(var(--text-muted))" }}>
                          {entry.weight} kg
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Smart Health Guidance */}
          <SmartGuidance entries={entries} currentWeek={currentWeek} />

          {/* Daily Tips */}
          <motion.div variants={fadeUp}>
            <p className="label-caps text-text-muted mb-2">DAILY WELLNESS TIPS</p>
            <div className="space-y-2">
              {HEALTH_TIPS.map((tip, i) => (
                <div key={i} className="tend-card p-3 flex items-center gap-3">
                  <div
                    className="w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: tip.color === "green" ? "hsl(var(--light-green))" : "hsl(var(--light-coral))" }}
                  >
                    <IonIcon name={tip.icon} size={16} style={{ color: tip.color === "green" ? "hsl(var(--green))" : "hsl(var(--coral))" }} />
                  </div>
                  <p className="text-[12px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>{tip.tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      ) : (
        <>
          {/* Baby Growth Card */}
          <motion.div variants={fadeUp} className="hero-card p-5">
            <p className="text-white/50 text-[10px] font-sans font-semibold uppercase tracking-wider">Week {currentWeek}</p>
            <h2 className="text-white text-[24px] font-serif mt-1">Baby is the size of a</h2>
            <p className="text-[28px] font-serif mt-0.5" style={{ color: "hsl(var(--coral))" }}>
              {currentMilestone.size}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[11px] font-sans font-medium px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                ~{currentMilestone.length}
              </span>
              <span className="text-[11px] font-sans font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                {currentMilestone.detail}
              </span>
            </div>
          </motion.div>

          {/* Milestone Timeline */}
          <motion.div variants={fadeUp}>
            <p className="label-caps text-text-muted mb-3">GROWTH MILESTONES</p>
            <div className="space-y-0">
              {BABY_MILESTONES.map((m, i) => {
                const isPast = currentWeek >= m.week;
                const isCurrent = currentWeek >= m.week && (i === BABY_MILESTONES.length - 1 || currentWeek < BABY_MILESTONES[i + 1].week);
                return (
                  <div key={m.week} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          background: isCurrent ? "hsl(var(--coral))" : isPast ? "hsl(var(--green))" : "hsl(var(--border-subtle))",
                          boxShadow: isCurrent ? "0 0 0 4px hsl(var(--light-coral))" : "none",
                        }}
                      />
                      {i < BABY_MILESTONES.length - 1 && (
                        <div className="w-0.5 h-8" style={{ background: isPast ? "hsl(var(--green))" : "hsl(var(--border-subtle))" }} />
                      )}
                    </div>
                    <div className="-mt-1 pb-3">
                      <p className="text-[12px] font-sans font-semibold" style={{ color: isCurrent ? "hsl(var(--coral))" : isPast ? "hsl(var(--dark))" : "hsl(var(--text-muted))" }}>
                        Week {m.week} — {m.size}
                      </p>
                      <p className="text-[10px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>{m.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* What to expect */}
          {nextMilestone && (
            <motion.div variants={fadeUp} className="tend-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <IonIcon name="sparkles" size={16} style={{ color: "hsl(var(--coral))" }} />
                <span className="text-[11px] font-sans font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>Coming Up</span>
              </div>
              <p className="text-[13px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>
                At week {nextMilestone.week}, your baby will be the size of a <strong>{nextMilestone.size}</strong> — {nextMilestone.detail.toLowerCase()}
              </p>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default HealthTrackerScreen;

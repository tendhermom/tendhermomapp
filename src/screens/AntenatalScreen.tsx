import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hapticLight } from "@/lib/despia";

interface AntenatalScreenProps {
  onNavigate: (tab: string) => void;
}

interface Reminder {
  id: string;
  title: string;
  description: string;
  week: number;
  type: "checkup" | "test" | "vaccine" | "milestone";
  completed: boolean;
}

interface CustomItem {
  title: string;
  description: string;
  week: number;
  type: "checkup" | "test" | "vaccine" | "milestone";
}

const ANTENATAL_SCHEDULE: Omit<Reminder, "id" | "completed">[] = [
  // First Trimester
  { week: 4, title: "Confirm Pregnancy", description: "Blood test (hCG) & urine test to confirm pregnancy", type: "test" },
  { week: 6, title: "First Prenatal Visit", description: "Medical history, physical exam, blood type & Rh factor", type: "checkup" },
  { week: 8, title: "Dating Scan", description: "Ultrasound to confirm gestational age & due date", type: "test" },
  { week: 10, title: "Blood Work Panel", description: "CBC, HIV, Hepatitis B & C, sickle cell, blood sugar", type: "test" },
  { week: 12, title: "Nuchal Translucency Scan", description: "Screen for Down syndrome & chromosomal conditions", type: "test" },
  // Second Trimester
  { week: 14, title: "Second Trimester Begins", description: "Review first trimester results with your doctor", type: "checkup" },
  { week: 16, title: "Routine Checkup", description: "Blood pressure, weight, fundal height, fetal heartbeat", type: "checkup" },
  { week: 18, title: "Anatomy Scan", description: "Detailed ultrasound to check baby's organs & growth", type: "test" },
  { week: 20, title: "Mid-Pregnancy Review", description: "Anatomy scan results review, gender reveal if desired", type: "checkup" },
  { week: 22, title: "Glucose Screen Prep", description: "Discuss upcoming gestational diabetes test", type: "checkup" },
  { week: 24, title: "Glucose Tolerance Test", description: "1-hour glucose challenge to screen for gestational diabetes", type: "test" },
  { week: 26, title: "Rhogam Injection", description: "For Rh-negative mothers — prevents Rh incompatibility", type: "vaccine" },
  // Third Trimester
  { week: 28, title: "Third Trimester Begins", description: "Bi-weekly visits start. CBC repeat, antibody screen", type: "checkup" },
  { week: 30, title: "Growth Scan", description: "Ultrasound to monitor baby's growth & amniotic fluid", type: "test" },
  { week: 32, title: "Fetal Position Check", description: "Confirm baby's position — head down is ideal", type: "checkup" },
  { week: 34, title: "Group B Strep Test", description: "Vaginal & rectal swab for GBS bacteria screening", type: "test" },
  { week: 36, title: "Weekly Visits Begin", description: "Cervical checks, blood pressure, baby's position", type: "checkup" },
  { week: 37, title: "Full Term!", description: "Baby is considered full term. Discuss birth plan with doctor", type: "milestone" },
  { week: 38, title: "Pre-Delivery Checkup", description: "Non-stress test, amniotic fluid check, readiness review", type: "checkup" },
  { week: 39, title: "Final Preparations", description: "Hospital bag ready, birth plan finalized, signs of labour review", type: "milestone" },
  { week: 40, title: "Due Date", description: "Monitor closely — discuss induction if needed after 41 weeks", type: "milestone" },
];

const TYPE_CONFIG = {
  checkup: { icon: "medkit-outline", color: "hsl(var(--green))", bg: "hsl(var(--light-green))", label: "Checkup" },
  test: { icon: "flask-outline", color: "hsl(var(--coral))", bg: "hsl(var(--light-coral))", label: "Test" },
  vaccine: { icon: "shield-checkmark-outline", color: "hsl(210 80% 55%)", bg: "hsl(210 80% 92%)", label: "Vaccine" },
  milestone: { icon: "star-outline", color: "hsl(45 93% 48%)", bg: "hsl(45 93% 92%)", label: "Milestone" },
};

const AntenatalScreen = ({ onNavigate }: AntenatalScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const currentWeek = useAuthStore((s) => s.getCurrentWeek());
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [customItems, setCustomItems] = useState<Omit<Reminder, "id" | "completed">[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<CustomItem>({ title: "", description: "", week: currentWeek, type: "checkup" });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`antenatal_completed_${user?.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old number-based sets to string IDs
      setCompletedItems(new Set(parsed.map((v: number | string) => String(v))));
    }
    const savedCustom = localStorage.getItem(`antenatal_custom_${user?.id}`);
    if (savedCustom) setCustomItems(JSON.parse(savedCustom));
  }, [user?.id]);

  const toggleComplete = (id: string) => {
    hapticLight();
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(`antenatal_completed_${user?.id}`, JSON.stringify([...next]));
      return next;
    });
  };

  const addCustomItem = () => {
    if (!newItem.title.trim()) { toast.error("Please enter a title"); return; }
    hapticLight();
    const updated = [...customItems, { ...newItem, title: newItem.title.trim(), description: newItem.description.trim() }];
    setCustomItems(updated);
    localStorage.setItem(`antenatal_custom_${user?.id}`, JSON.stringify(updated));
    setNewItem({ title: "", description: "", week: currentWeek, type: "checkup" });
    setShowAddModal(false);
    toast.success("Item added!");
  };

  const allItems = [...ANTENATAL_SCHEDULE, ...customItems];
  const schedule = allItems
    .sort((a, b) => a.week - b.week)
    .map((item, i) => {
      const id = i < ANTENATAL_SCHEDULE.length ? `week-${item.week}` : `custom-${i}`;
      return { ...item, id, completed: completedItems.has(id) };
    });

  const filtered = schedule.filter((item) => {
    if (filter === "upcoming") return !item.completed && item.week >= currentWeek;
    if (filter === "completed") return item.completed;
    return true;
  });

  const completedCount = schedule.filter((r) => r.completed).length;
  const progressPercent = Math.round((completedCount / schedule.length) * 100);

  // Find next upcoming
  const nextUp = schedule.find((r) => !r.completed && r.week >= currentWeek);

  return (
    <motion.div
      className="space-y-5 pb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNavigate("home")} className="p-1">
          <IonIcon name="chevron-back-outline" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>Antenatal Care</h1>
      </div>

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-card p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/50 text-[11px] font-sans uppercase tracking-wider">Your Progress</p>
            <p className="text-white text-[28px] font-serif mt-0.5">{completedCount}/{schedule.length}</p>
          </div>
          <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
            <span className="text-white text-[18px] font-sans font-bold">{progressPercent}%</span>
          </div>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: "hsl(var(--coral))" }}
          />
        </div>
        <p className="text-[11px] font-sans mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
          Currently at <span className="font-semibold" style={{ color: "hsl(var(--coral))" }}>Week {currentWeek}</span>
        </p>
      </motion.div>

      {/* Next Upcoming */}
      {nextUp && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="tend-card p-4"
        >
          <p className="text-[10px] font-sans font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--coral))" }}>Coming Up — Week {nextUp.week}</p>
          <p className="text-[15px] font-sans font-semibold mt-1" style={{ color: "hsl(var(--dark))" }}>{nextUp.title}</p>
          <p className="text-[12px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>{nextUp.description}</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate("appointments")}
            className="mt-3 px-4 py-2 rounded-xl text-[12px] font-sans font-semibold"
            style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
          >
            Book Appointment →
          </motion.button>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "upcoming", "completed"] as const).map((f) => (
          <motion.button
            key={f}
            whileTap={{ scale: 0.95 }}
            onClick={() => { hapticLight(); setFilter(f); }}
            className="px-4 py-[7px] rounded-full text-[12px] font-sans font-semibold capitalize"
            style={{
              background: filter === f ? "hsl(var(--green))" : "hsl(var(--surface))",
              color: filter === f ? "white" : "hsl(var(--text-muted))",
              boxShadow: filter === f ? "none" : "0 1px 3px hsla(0,0%,0%,0.06)",
            }}
          >
            {f} {f === "completed" ? `(${completedCount})` : ""}
          </motion.button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, i) => {
            const config = TYPE_CONFIG[item.type];
            const isPast = item.week < currentWeek;
            const isCurrent = item.week === currentWeek || (item.week > currentWeek && item.week === nextUp?.week);

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.03 }}
                className="flex gap-3 relative"
              >
                {/* Timeline line */}
                <div className="flex flex-col items-center w-[28px] flex-shrink-0">
                  <div
                    className="w-[28px] h-[28px] rounded-full flex items-center justify-center z-10"
                    style={{
                      background: item.completed ? "hsl(var(--green))" : isCurrent ? "hsl(var(--coral))" : "hsl(var(--surface))",
                      border: item.completed || isCurrent ? "none" : "2px solid hsl(var(--border-subtle))",
                    }}
                  >
                    {item.completed ? (
                      <IonIcon name="checkmark" size={14} style={{ color: "white" }} />
                    ) : (
                      <span className="text-[10px] font-sans font-bold" style={{ color: isCurrent ? "white" : "hsl(var(--text-muted))" }}>
                        {item.week}
                      </span>
                    )}
                  </div>
                  {i < filtered.length - 1 && (
                    <div className="w-[2px] flex-1 min-h-[20px]" style={{ background: item.completed ? "hsl(var(--green))" : "hsl(var(--border-subtle))" }} />
                  )}
                </div>

                {/* Content */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleComplete(item.id)}
                  className="flex-1 tend-card p-3.5 mb-2 text-left"
                  style={{ opacity: item.completed ? 0.6 : 1 }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                      style={{ background: config.bg }}
                    >
                      <IonIcon name={config.icon} size={18} style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className="text-[14px] font-sans font-semibold"
                          style={{
                            color: "hsl(var(--dark))",
                            textDecoration: item.completed ? "line-through" : "none",
                          }}
                        >
                          {item.title}
                        </p>
                        <span
                          className="text-[9px] font-sans font-semibold uppercase px-2 py-[2px] rounded-full"
                          style={{ background: config.bg, color: config.color }}
                        >
                          {config.label}
                        </span>
                      </div>
                      <p className="text-[11px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                        {item.description}
                      </p>
                      <p className="text-[10px] font-sans mt-1 font-medium" style={{ color: isPast ? "hsl(var(--text-muted))" : "hsl(var(--green))" }}>
                        Week {item.week} {isPast && !item.completed ? "• Overdue" : ""}
                      </p>
                    </div>
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <IonIcon name="checkmark-circle-outline" size={48} style={{ color: "hsl(var(--green))" }} />
          <p className="text-[14px] font-sans font-semibold mt-3" style={{ color: "hsl(var(--dark))" }}>
            {filter === "completed" ? "No completed items yet" : "All caught up!"}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default AntenatalScreen;

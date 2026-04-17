import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";
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
  isCustom?: boolean;
}

interface CustomItem {
  title: string;
  description: string;
  week: number;
  type: "checkup" | "test" | "vaccine" | "milestone";
}

const ANTENATAL_SCHEDULE: Omit<Reminder, "id" | "completed" | "isCustom">[] = [
  { week: 4, title: "Confirm Pregnancy", description: "Blood test (hCG) & urine test to confirm pregnancy", type: "test" },
  { week: 6, title: "First Prenatal Visit", description: "Medical history, physical exam, blood type & Rh factor", type: "checkup" },
  { week: 8, title: "Dating Scan", description: "Ultrasound to confirm gestational age & due date", type: "test" },
  { week: 10, title: "Blood Work Panel", description: "CBC, HIV, Hepatitis B & C, sickle cell, blood sugar", type: "test" },
  { week: 12, title: "Nuchal Translucency Scan", description: "Screen for Down syndrome & chromosomal conditions", type: "test" },
  { week: 14, title: "Second Trimester Begins", description: "Review first trimester results with your doctor", type: "checkup" },
  { week: 16, title: "Routine Checkup", description: "Blood pressure, weight, fundal height, fetal heartbeat", type: "checkup" },
  { week: 18, title: "Anatomy Scan", description: "Detailed ultrasound to check baby's organs & growth", type: "test" },
  { week: 20, title: "Mid-Pregnancy Review", description: "Anatomy scan results review, gender reveal if desired", type: "checkup" },
  { week: 22, title: "Glucose Screen Prep", description: "Discuss upcoming gestational diabetes test", type: "checkup" },
  { week: 24, title: "Glucose Tolerance Test", description: "1-hour glucose challenge to screen for gestational diabetes", type: "test" },
  { week: 26, title: "Rhogam Injection", description: "For Rh-negative mothers — prevents Rh incompatibility", type: "vaccine" },
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
  test: { icon: "flask-outline", color: "hsl(210 80% 55%)", bg: "hsl(210 80% 92%)", label: "Test" },
  vaccine: { icon: "shield-checkmark-outline", color: "hsl(270 60% 55%)", bg: "hsl(270 60% 92%)", label: "Vaccine" },
  milestone: { icon: "star-outline", color: "hsl(45 93% 48%)", bg: "hsl(45 93% 92%)", label: "Milestone" },
};

/* ─── Swipeable Timeline Item ─── */
const SwipeableItem = ({
  item,
  config,
  isPast,
  isCurrent,
  isLast,
  onToggle,
  onDelete,
}: {
  item: Reminder;
  config: typeof TYPE_CONFIG.checkup;
  isPast: boolean;
  isCurrent: boolean;
  isLast: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}) => {
  const [swiped, setSwiped] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (item.isCustom && info.offset.x < -60) {
      setSwiped(true);
    } else {
      setSwiped(false);
    }
  };

  return (
    <div className="flex gap-3 relative">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center w-[28px] flex-shrink-0">
        <div
          className="w-[28px] h-[28px] rounded-full flex items-center justify-center z-10"
          style={{
            background: item.completed ? "hsl(var(--green))" : isCurrent ? "hsl(var(--green))" : "hsl(var(--surface))",
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
        {!isLast && (
          <div className="w-[2px] flex-1 min-h-[20px]" style={{ background: item.completed ? "hsl(var(--green))" : "hsl(var(--border-subtle))" }} />
        )}
      </div>

      {/* Swipeable content area */}
      <div className="flex-1 mb-2 relative overflow-hidden rounded-2xl">
        {/* Delete background */}
        {item.isCustom && (
          <div className="absolute inset-0 flex items-center justify-end pr-5 rounded-2xl" style={{ background: "hsl(var(--destructive))" }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { hapticLight(); onDelete?.(); }}
              className="flex items-center gap-1.5 text-white"
            >
              <IonIcon name="trash-outline" size={18} style={{ color: "white" }} />
              <span className="text-[12px] font-sans font-semibold">Delete</span>
            </motion.button>
          </div>
        )}

        {/* Card content */}
        <motion.div
          drag={item.isCustom ? "x" : false}
          dragConstraints={{ left: -100, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={{ x: swiped ? -100 : 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="tend-card p-3.5 relative z-10"
          style={{ opacity: item.completed ? 0.6 : 1, cursor: item.isCustom ? "grab" : "pointer" }}
          onClick={() => { if (!swiped) onToggle(); else setSwiped(false); }}
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
                  style={{ color: "hsl(var(--dark))", textDecoration: item.completed ? "line-through" : "none" }}
                >
                  {item.title}
                </p>
                <span
                  className="text-[9px] font-sans font-semibold uppercase px-2 py-[2px] rounded-full"
                  style={{ background: config.bg, color: config.color }}
                >
                  {config.label}
                </span>
                {item.isCustom && (
                  <span className="text-[8px] font-sans font-bold uppercase px-1.5 py-[1px] rounded-full" style={{ background: "hsl(var(--surface))", color: "hsl(var(--text-muted))" }}>
                    Custom
                  </span>
                )}
              </div>
              <p className="text-[11px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                {item.description}
              </p>
              <p className="text-[10px] font-sans mt-1 font-medium" style={{ color: isPast ? "hsl(var(--text-muted))" : "hsl(var(--green))" }}>
                Week {item.week} {isPast && !item.completed ? "• Overdue" : ""}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ─── Main Screen ─── */
const AntenatalScreen = ({ onNavigate }: AntenatalScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const currentWeek = useAuthStore((s) => s.getCurrentWeek());
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [customItems, setCustomItems] = useState<Omit<Reminder, "id" | "completed" | "isCustom">[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<CustomItem>({ title: "", description: "", week: currentWeek, type: "checkup" });

  useEffect(() => {
    const saved = localStorage.getItem(`antenatal_completed_${user?.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
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

  const deleteCustomItem = (customIndex: number) => {
    hapticLight();
    const updated = customItems.filter((_, i) => i !== customIndex);
    setCustomItems(updated);
    localStorage.setItem(`antenatal_custom_${user?.id}`, JSON.stringify(updated));
    // Also remove completion state
    const id = `custom-${ANTENATAL_SCHEDULE.length + customIndex}`;
    setCompletedItems((prev) => {
      const next = new Set(prev);
      next.delete(id);
      localStorage.setItem(`antenatal_completed_${user?.id}`, JSON.stringify([...next]));
      return next;
    });
    toast.success("Item removed");
  };

  const allItems = [...ANTENATAL_SCHEDULE, ...customItems];
  const schedule: Reminder[] = allItems
    .sort((a, b) => a.week - b.week)
    .map((item, i) => {
      const isCustom = i >= ANTENATAL_SCHEDULE.length;
      const id = isCustom ? `custom-${i}` : `week-${item.week}`;
      return { ...item, id, completed: completedItems.has(id), isCustom };
    });

  const filtered = schedule.filter((item) => {
    if (filter === "upcoming") return !item.completed && item.week >= currentWeek;
    if (filter === "completed") return item.completed;
    return true;
  });

  const completedCount = schedule.filter((r) => r.completed).length;
  const progressPercent = Math.round((completedCount / schedule.length) * 100);
  const nextUp = schedule.find((r) => !r.completed && r.week >= currentWeek);

  // Stats
  const totalByType = {
    checkup: schedule.filter((s) => s.type === "checkup").length,
    test: schedule.filter((s) => s.type === "test").length,
    vaccine: schedule.filter((s) => s.type === "vaccine").length,
    milestone: schedule.filter((s) => s.type === "milestone").length,
  };

  return (
    <motion.div className="space-y-5 pb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNavigate("home")} className="p-1">
          <IonIcon name="chevron-back-outline" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>Antenatal Care</h1>
      </div>

      {/* Premium Hero — Current Week Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, hsl(var(--green)), hsl(160 40% 22%))" }}
      >
        {/* Decorative circle */}
        <div className="absolute -left-6 -bottom-6 w-[120px] h-[120px] rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="absolute right-4 top-4 w-[60px] h-[60px] rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />

        <div className="flex items-center gap-4 relative z-10">
          {/* Week circle */}
          <div
            className="w-[60px] h-[60px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.2)" }}
          >
            <span className="text-white text-[24px] font-serif font-bold">{currentWeek}</span>
          </div>

          <div className="flex-1">
            <p className="text-[10px] font-sans font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
              You are at
            </p>
            <p className="text-white text-[22px] font-serif font-bold mt-0.5">Week {currentWeek}</p>
            <p className="text-[12px] font-sans mt-0.5" style={{ color: "hsl(var(--coral))" }}>
              {nextUp?.title || "Your journey continues"}
            </p>
          </div>

          {/* View button → opens Insights */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { hapticLight(); onNavigate("insights"); }}
            className="px-4 py-2 rounded-xl text-[12px] font-sans font-semibold"
            style={{ background: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(8px)" }}
          >
            View →
          </motion.button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 relative z-10">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-sans font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
              Progress
            </p>
            <p className="text-[12px] font-sans font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>
              {completedCount}/{schedule.length}
            </p>
          </div>
          <div className="h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(45 93% 58%), hsl(var(--coral)))" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Type Stats Row */}
      <div className="flex gap-2">
        {(Object.entries(totalByType) as [keyof typeof TYPE_CONFIG, number][]).map(([type, count], i) => {
          const c = TYPE_CONFIG[type];
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex-1 tend-card p-3.5 flex flex-col items-center gap-1.5"
            >
              <div
                className="w-[36px] h-[36px] rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--surface))", border: `1.5px solid hsl(var(--border-subtle))` }}
              >
                <IonIcon name={c.icon} size={17} style={{ color: c.color }} />
              </div>
              <p className="text-[18px] font-sans font-bold" style={{ color: "hsl(var(--dark))" }}>{count}</p>
              <p className="text-[9px] font-sans font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--text-muted))" }}>{c.label}s</p>
            </motion.div>
          );
        })}
      </div>

      {/* Next Upcoming */}
      {nextUp && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="tend-card p-4"
        >
          <p className="text-[10px] font-sans font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--green))" }}>
            Coming Up — Week {nextUp.week}
          </p>
          <p className="text-[15px] font-sans font-semibold mt-1" style={{ color: "hsl(var(--dark))" }}>{nextUp.title}</p>
          <p className="text-[12px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>{nextUp.description}</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate("health-hubs")}
            className="mt-3 px-4 py-2 rounded-xl text-[12px] font-sans font-semibold"
            style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
          >
            Open Rescue Map →
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
            const customIndex = item.isCustom ? allItems.indexOf(allItems.find((a) => a.title === item.title && a.week === item.week && a.type === item.type)!) - ANTENATAL_SCHEDULE.length : -1;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.03 }}
              >
                <SwipeableItem
                  item={item}
                  config={config}
                  isPast={isPast}
                  isCurrent={isCurrent}
                  isLast={i === filtered.length - 1}
                  onToggle={() => toggleComplete(item.id)}
                  onDelete={item.isCustom ? () => deleteCustomItem(customIndex) : undefined}
                />
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

      {/* Add More Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => { hapticLight(); setShowAddModal(true); }}
        className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-sans font-semibold"
        style={{ background: "hsl(var(--surface))", color: "hsl(var(--green))", border: "1.5px dashed hsl(var(--border-subtle))" }}
      >
        <IonIcon name="add-circle-outline" size={18} style={{ color: "hsl(var(--green))" }} />
        Add More
      </motion.button>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-[480px] rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
              style={{ background: "hsl(var(--card))", paddingBottom: "max(env(safe-area-inset-bottom, 100px), 100px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-serif font-semibold" style={{ color: "hsl(var(--dark))" }}>Add Item</h3>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAddModal(false)}>
                  <IonIcon name="close-outline" size={22} style={{ color: "hsl(var(--text-muted))" }} />
                </motion.button>
              </div>

              {/* Type Selector */}
              <div className="flex gap-2">
                {(["checkup", "test", "vaccine", "milestone"] as const).map((t) => {
                  const c = TYPE_CONFIG[t];
                  return (
                    <motion.button
                      key={t}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setNewItem((p) => ({ ...p, type: t }))}
                      className="flex-1 py-2 rounded-xl text-[11px] font-sans font-semibold capitalize"
                      style={{
                        background: newItem.type === t ? c.color : c.bg,
                        color: newItem.type === t ? "white" : c.color,
                      }}
                    >
                      {c.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Week */}
              <div>
                <label className="text-[11px] font-sans font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>Week</label>
                <input
                  type="number"
                  min={1}
                  max={42}
                  value={newItem.week}
                  onChange={(e) => setNewItem((p) => ({ ...p, week: Number(e.target.value) }))}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl text-[14px] font-sans"
                  style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", border: "1px solid hsl(var(--border-subtle))" }}
                />
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] font-sans font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>Title</label>
                <input
                  type="text"
                  placeholder="e.g. Iron supplement check"
                  value={newItem.title}
                  onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl text-[14px] font-sans"
                  style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", border: "1px solid hsl(var(--border-subtle))" }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-sans font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>Description</label>
                <textarea
                  placeholder="Brief description..."
                  value={newItem.description}
                  onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl text-[14px] font-sans resize-none"
                  style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", border: "1px solid hsl(var(--border-subtle))" }}
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={addCustomItem}
                className="w-full py-3.5 rounded-2xl text-[14px] font-sans font-semibold text-white"
                style={{ background: "hsl(var(--green))" }}
              >
                Add to Timeline
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AntenatalScreen;

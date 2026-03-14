import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import ReminderCard from "@/components/cards/ReminderCard";
import { useRemindersStore, type Reminder } from "@/stores/remindersStore";

interface RemindersScreenProps {
  onBack: () => void;
}

const typeOptions: { value: Reminder["type"]; label: string; icon: string }[] = [
  { value: "medication", label: "Medication", icon: "medkit-outline" },
  { value: "appointment", label: "Appointment", icon: "calendar-outline" },
  { value: "hydration", label: "Hydration", icon: "water-outline" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const RemindersScreen = ({ onBack }: RemindersScreenProps) => {
  const { reminders, addReminder, toggleReminder, removeReminder, fetchReminders } = useRemindersStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<Reminder["type"]>("medication");

  useEffect(() => {
    fetchReminders();
  }, []);

  const pending = reminders.filter((r) => !r.done);
  const completed = reminders.filter((r) => r.done);

  const handleAdd = () => {
    if (!title.trim() || !time.trim()) return;
    const icon = typeOptions.find((t) => t.value === type)?.icon || "alarm-outline";
    addReminder({ icon, title: title.trim(), subtitle: subtitle.trim(), time: time.trim(), type });
    setTitle("");
    setSubtitle("");
    setTime("");
    setType("medication");
    setShowForm(false);
  };

  return (
    <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.88 }} onClick={onBack} className="ios-press">
          <IonIcon name="chevron-back" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1 className="font-serif text-dark text-[24px] flex-1">Reminders</h1>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setShowForm(!showForm)}
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center"
          style={{ background: "hsl(var(--green))" }}
        >
          <IonIcon name={showForm ? "close" : "add"} size={20} style={{ color: "white" }} />
        </motion.button>
      </motion.div>

      {/* Add Reminder Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="tend-card p-5 space-y-4">
              <h3 className="text-[16px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
                New Reminder
              </h3>

              {/* Type selector */}
              <div className="flex gap-2">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
                    style={{
                      background: type === opt.value ? "hsl(var(--green))" : "hsl(var(--light-green))",
                      color: type === opt.value ? "white" : "hsl(var(--green))",
                    }}
                  >
                    <IonIcon name={opt.icon} size={16} style={{ color: type === opt.value ? "white" : "hsl(var(--green))" }} />
                    <span className="text-[12px] font-semibold font-sans">{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Title */}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Reminder title"
                className="w-full px-4 py-3 rounded-xl text-[14px] font-sans outline-none"
                style={{
                  background: "hsl(var(--bg))",
                  color: "hsl(var(--dark))",
                  border: "1px solid hsl(var(--border-subtle))",
                }}
              />

              {/* Subtitle */}
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Note (optional)"
                className="w-full px-4 py-3 rounded-xl text-[14px] font-sans outline-none"
                style={{
                  background: "hsl(var(--bg))",
                  color: "hsl(var(--dark))",
                  border: "1px solid hsl(var(--border-subtle))",
                }}
              />

              {/* Time */}
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Time (e.g. 9:00 AM)"
                className="w-full px-4 py-3 rounded-xl text-[14px] font-sans outline-none"
                style={{
                  background: "hsl(var(--bg))",
                  color: "hsl(var(--dark))",
                  border: "1px solid hsl(var(--border-subtle))",
                }}
              />

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleAdd}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold font-sans ios-press"
                style={{
                  background: "hsl(var(--green))",
                  color: "white",
                  opacity: title.trim() && time.trim() ? 1 : 0.5,
                }}
              >
                Add Reminder
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-2">
          Upcoming · {pending.length}
        </p>
        <div className="space-y-2.5">
          {pending.length === 0 && (
            <div className="tend-card p-6 flex flex-col items-center gap-2">
              <IonIcon name="checkmark-circle-outline" size={36} style={{ color: "hsl(var(--green))" }} />
              <p className="text-[14px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                All caught up! 🎉
              </p>
            </div>
          )}
          {pending.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring" as const, stiffness: 300, damping: 30 }}
            >
              <div className="relative">
                <ReminderCard {...r} onToggle={() => toggleReminder(r.id)} />
                <button
                  onClick={() => removeReminder(r.id)}
                  className="absolute top-3 right-3 w-[24px] h-[24px] rounded-full flex items-center justify-center ios-press"
                  style={{ background: "hsl(var(--light-coral))" }}
                >
                  <IonIcon name="trash-outline" size={12} style={{ color: "hsl(var(--coral))" }} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Completed */}
      {completed.length > 0 && (
        <motion.div variants={fadeUp}>
          <p className="label-caps text-text-muted mb-2">
            Completed · {completed.length}
          </p>
          <div className="space-y-2.5">
            {completed.map((r) => (
              <ReminderCard key={r.id} {...r} onToggle={() => toggleReminder(r.id)} />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RemindersScreen;

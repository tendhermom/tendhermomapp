import { useState } from "react";
import PregnancyCard from "@/components/cards/PregnancyCard";
import ReminderCard from "@/components/cards/ReminderCard";
import BabyShowerCard from "@/components/cards/BabyShowerCard";
import HealthTipChip from "@/components/chips/HealthTipChip";
import QuickAccessGrid from "@/components/QuickAccessGrid";
import TopBar from "@/components/navigation/TopBar";
import { motion } from "framer-motion";

interface HomeScreenProps {
  onNavigate: (tab: string) => void;
}

const initialReminders = [
  {
    id: "1",
    icon: "medkit-outline",
    title: "Prenatal Vitamins",
    subtitle: "Take with breakfast",
    time: "8:00 AM",
    type: "medication" as const,
    done: false,
  },
  {
    id: "2",
    icon: "calendar-outline",
    title: "Dr. Adaeze – Checkup",
    subtitle: "Lagos Women's Clinic",
    time: "10:30 AM",
    type: "appointment" as const,
    done: false,
  },
  {
    id: "3",
    icon: "water-outline",
    title: "Drink Water",
    subtitle: "Glass 4 of 8 today",
    time: "12:00 PM",
    type: "hydration" as const,
    done: false,
  },
];

const babyShowerData = [
  { name: "Chidi", parentName: "Ngozi & Emeka", date: "March 2026", imageUrl: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop", gender: "boy" as const },
  { name: "Adaeze", parentName: "Funke & Tunde", date: "March 2026", imageUrl: "https://images.unsplash.com/photo-1544126592-807ade215a0b?w=400&h=300&fit=crop", gender: "girl" as const },
  { name: "Obioma", parentName: "Chioma & Uche", date: "March 2026", imageUrl: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop", gender: "boy" as const },
  { name: "Nneka", parentName: "Amaka & Ife", date: "March 2026", imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop", gender: "girl" as const },
];

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  const [reminders, setReminders] = useState(initialReminders);

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r))
    );
  };

  return (
    <motion.div
      className="space-y-6 pb-4"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <TopBar
          onProfilePress={() => onNavigate("profile")}
          onAIChatPress={() => onNavigate("ai-chat")}
        />
      </motion.div>

      {/* Greeting */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-0.5">Good morning</p>
        <h1 className="font-serif text-dark" style={{ fontSize: "26px" }}>
          Hello, Amara
        </h1>
      </motion.div>

      {/* Pregnancy tracker */}
      <motion.div variants={fadeUp}>
        <PregnancyCard />
      </motion.div>

      {/* Quick Access */}
      <motion.div variants={fadeUp}>
        <h2 className="font-serif text-dark text-[20px] mb-3">Quick Access</h2>
        <QuickAccessGrid onNavigate={onNavigate} />
      </motion.div>

      {/* Reminders */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-dark text-[20px]">Reminders</h2>
          <button
            onClick={() => onNavigate("reminders")}
            className="flex items-center gap-0.5 ios-press"
          >
            <span className="text-[13px] font-semibold font-sans" style={{ color: "hsl(var(--green))" }}>
              See All
            </span>
          </button>
        </div>
        <div className="space-y-2.5">
          {reminders.map((reminder, i) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.07, type: "spring" as const, stiffness: 300, damping: 30 }}
            >
              <ReminderCard
                {...reminder}
                onToggle={() => toggleReminder(reminder.id)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Baby Shower – Babies of the Month */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-dark text-[20px]">Babies of the Month</h2>
          <div
            className="px-2 py-0.5 rounded-full"
            style={{ background: "hsl(var(--light-coral))" }}
          >
            <span className="text-[11px] font-bold font-sans" style={{ color: "hsl(var(--coral))" }}>
              🎉 March
            </span>
          </div>
        </div>
        <div className="-mx-5">
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
            {babyShowerData.map((baby, i) => (
              <motion.div
                key={i}
                className="snap-start"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08, type: "spring" as const, stiffness: 300, damping: 30 }}
              >
                <BabyShowerCard {...baby} />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Health tips */}
      <motion.div variants={fadeUp} className="space-y-2.5">
        <h2 className="font-serif text-dark text-[20px]">Today's Tips</h2>
        <HealthTipChip
          icon="water-outline"
          tip="Drink 8 cups of water today"
          onViewRecord={() => onNavigate("records")}
        />
        <HealthTipChip
          icon="nutrition-outline"
          tip="Include folate-rich foods in your meals"
          onViewRecord={() => onNavigate("records")}
        />
      </motion.div>
    </motion.div>
  );
};

export default HomeScreen;

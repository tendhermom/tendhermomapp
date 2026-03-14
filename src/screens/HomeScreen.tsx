import { useEffect, useState } from "react";
import PregnancyCard from "@/components/cards/PregnancyCard";
import ReminderCard from "@/components/cards/ReminderCard";
import BabyShowerCard from "@/components/cards/BabyShowerCard";
import HealthTipChip from "@/components/chips/HealthTipChip";
import QuickAccessGrid from "@/components/QuickAccessGrid";
import TopBar from "@/components/navigation/TopBar";
import { useRemindersStore } from "@/stores/remindersStore";
import { useAuthStore } from "@/stores/authStore";
import IonIcon from "@/components/IonIcon";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface HomeScreenProps {
  onNavigate: (tab: string) => void;
}

interface HealthTip {
  id: string;
  title: string;
  body: string;
  icon: string | null;
  category: string;
  week_number: number | null;
}

  id: string;
  baby_name: string;
  parent_names: string;
  month_label: string;
  gender: string;
  image_url: string | null;
  reactions_count: number;
}

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
  const { reminders, toggleReminder, fetchReminders } = useRemindersStore();
  const pendingReminders = reminders.filter((r) => !r.done).slice(0, 3);
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan_type === "premium";

  const [babyPosts, setBabyPosts] = useState<BabyShowerPost[]>([]);

  useEffect(() => {
    fetchReminders();
    fetchBabyPosts();
  }, []);

  const fetchBabyPosts = async () => {
    const now = new Date();
    const currentMonth = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const { data } = await supabase
      .from("baby_shower_posts")
      .select("id, baby_name, parent_names, month_label, gender, image_url, reactions_count")
      .eq("month_label", currentMonth)
      .order("created_at", { ascending: false })
      .limit(6);
    if (data) setBabyPosts(data);
  };

  const handleCongrats = () => {
    if (isPremium) {
      onNavigate("baby-shower");
    } else {
      onNavigate("premium");
    }
  };

  const displayName = user?.full_name?.split(" ")[0] || "there";

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
          Hello, {displayName}
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
          {pendingReminders.length === 0 && (
            <div className="tend-card p-5 flex flex-col items-center gap-2">
              <IonIcon name="checkmark-circle" size={28} style={{ color: "hsl(var(--green))" }} />
              <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                All reminders completed!
              </p>
            </div>
          )}
          {pendingReminders.map((reminder, i) => (
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
          <button
            onClick={() => onNavigate("baby-shower")}
            className="flex items-center gap-0.5 ios-press"
          >
            <span className="text-[13px] font-semibold font-sans" style={{ color: "hsl(var(--green))" }}>
              See All
            </span>
          </button>
        </div>
        {babyPosts.length > 0 ? (
          <div
            className="flex gap-3.5 overflow-x-auto pb-3 snap-x snap-mandatory hide-scrollbar"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {babyPosts.map((post, i) => (
              <motion.div
                key={post.id}
                className="snap-start flex-shrink-0"
                style={{ width: 180 }}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08, type: "spring" as const, stiffness: 300, damping: 30 }}
              >
                <BabyShowerCard
                  name={post.baby_name}
                  parentName={post.parent_names}
                  date={post.month_label}
                  imageUrl={post.image_url || "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop"}
                  gender={post.gender as "boy" | "girl"}
                  reactionsCount={post.reactions_count}
                  onCongrats={handleCongrats}
                />
              </motion.div>
            ))}
            <div className="flex-shrink-0 w-1" />
          </div>
        ) : (
          <div className="tend-card p-5 text-center">
            <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              No babies this month yet
            </p>
          </div>
        )}
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

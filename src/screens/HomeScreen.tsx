import PregnancyCard from "@/components/cards/PregnancyCard";
import CommunityCard from "@/components/cards/CommunityCard";
import HealthTipChip from "@/components/chips/HealthTipChip";
import QuickAccessGrid from "@/components/QuickAccessGrid";
import TopBar from "@/components/navigation/TopBar";
import { motion } from "framer-motion";

interface HomeScreenProps {
  onNavigate: (tab: string) => void;
}

const communityPosts = [
  {
    title: "First-time moms support group",
    pill: "New Moms",
    preview: "Share your journey with other first-time moms. Tips, stories, and encouragement.",
    members: 2340,
    authorName: "Chioma Eze",
    isPremium: true,
  },
  {
    title: "Due in June 2026",
    pill: "Due Date",
    preview: "Connect with moms expecting around the same time as you!",
    members: 876,
    authorName: "Ngozi Ibe",
  },
  {
    title: "Nigerian pregnancy recipes",
    pill: "Nutrition",
    preview: "Healthy Nigerian meals perfect for each trimester of pregnancy.",
    members: 1520,
    authorName: "Dr. Funke A.",
    isExpert: true,
  },
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

      {/* Community section */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-dark text-[20px]">Community</h2>
          <button
            onClick={() => onNavigate("community")}
            className="flex items-center gap-0.5 ios-press"
          >
            <span className="text-[13px] font-semibold font-sans" style={{ color: "hsl(var(--green))" }}>See All</span>
          </button>
        </div>
        <div className="space-y-3">
          {communityPosts.map((post, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, type: "spring", stiffness: 300, damping: 30 }}
            >
              <CommunityCard
                {...post}
                onClick={() => onNavigate("community")}
              />
            </motion.div>
          ))}
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

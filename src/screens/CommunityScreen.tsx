import CommunityCard from "@/components/cards/CommunityCard";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

const posts = [
  {
    title: "Morning sickness remedies that actually work",
    pill: "Tips",
    preview: "Ginger tea and small frequent meals have been a lifesaver for me. What works for you?",
    members: 156,
  },
  {
    title: "Exercises safe for second trimester",
    pill: "Fitness",
    preview: "My doctor recommended swimming and prenatal yoga. Anyone else doing these?",
    members: 89,
  },
  {
    title: "Hospital bag checklist",
    pill: "Preparation",
    preview: "Starting to pack early! Here's my list so far—what am I missing?",
    members: 432,
  },
  {
    title: "Dealing with pregnancy insomnia",
    pill: "Wellness",
    preview: "Week 28 and I can't sleep anymore. Tips from experienced moms?",
    members: 67,
  },
  {
    title: "Best antenatal clinics in Lagos",
    pill: "Recommendations",
    preview: "Looking for recommendations for good antenatal care in Lagos Island area.",
    members: 245,
  },
  {
    title: "Pregnancy cravings: What's yours?",
    pill: "Fun",
    preview: "I can't stop eating suya 😂 Tell me I'm not alone!",
    members: 1203,
  },
];

const CommunityScreen = () => {
  return (
    <div className="space-y-4 pb-4 relative">
      {/* iOS Large title header */}
      <div>
        <h1 className="ios-large-title text-foreground" style={{ fontSize: "28px" }}>
          Community
        </h1>
        <p className="ios-footnote text-muted-foreground mt-1">
          Connect with other moms
        </p>
      </div>

      {/* Search bar */}
      <div
        className="flex items-center gap-2 px-3 py-[10px] rounded-xl"
        style={{ background: "hsl(var(--ios-grouped-bg))" }}
      >
        <IonIcon name="search" size={18} style={{ color: "hsl(var(--text-tertiary))" }} />
        <span className="ios-body text-muted-foreground">Search discussions...</span>
      </div>

      <div className="space-y-3">
        {posts.map((post, i) => (
          <CommunityCard key={i} {...post} />
        ))}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-5 w-[56px] h-[56px] rounded-full flex items-center justify-center z-40"
        style={{
          background: "hsl(var(--coral))",
          boxShadow: "0 6px 20px hsla(11, 74%, 63%, 0.4)",
        }}
      >
        <IonIcon name="add" size={28} style={{ color: "white" }} />
      </motion.button>
    </div>
  );
};

export default CommunityScreen;

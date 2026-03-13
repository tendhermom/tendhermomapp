import CommunityCard from "@/components/cards/CommunityCard";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

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
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Community
        </h2>
        <p className="text-sm text-muted-foreground">
          Connect with other moms
        </p>
      </div>

      <div className="space-y-3">
        {posts.map((post, i) => (
          <CommunityCard key={i} {...post} />
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg z-40"
      >
        <Plus size={24} />
      </motion.button>
    </div>
  );
};

export default CommunityScreen;

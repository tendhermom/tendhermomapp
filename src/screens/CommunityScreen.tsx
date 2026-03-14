import CommunityCard from "@/components/cards/CommunityCard";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import TopBar from "@/components/navigation/TopBar";

interface CommunityScreenProps {
  onNavigate: (tab: string) => void;
}

const posts = [
  {
    title: "Morning sickness remedies that actually work",
    pill: "Tips",
    preview: "Ginger tea and small frequent meals have been a lifesaver for me. What works for you?",
    members: 156,
    authorName: "Ada Nwosu",
    isPremium: true,
  },
  {
    title: "Best hospitals in Lagos for delivery",
    pill: "Recommendations",
    preview: "Looking for hospital recommendations. Where are you ladies delivering?",
    members: 432,
    authorName: "Dr. Bola O.",
    isExpert: true,
  },
  {
    title: "Second trimester energy boost",
    pill: "Health",
    preview: "Finally feeling more energetic! Here's what helped me get through the first trimester fatigue.",
    members: 289,
    authorName: "Kemi Lawal",
  },
  {
    title: "Baby names — Nigerian & modern",
    pill: "Names",
    preview: "Share your favorite baby names! Looking for meaningful Igbo and Yoruba names.",
    members: 1876,
    authorName: "Ifeoma C.",
    isPremium: true,
  },
  {
    title: "Pregnancy cravings — share yours!",
    pill: "Fun",
    preview: "I can't stop eating suya! Tell me I'm not alone in these wild cravings.",
    members: 1203,
    authorName: "Ngozi Ibe",
  },
];

const CommunityScreen = ({ onNavigate }: CommunityScreenProps) => {
  return (
    <div className="space-y-5 pb-4 relative">
      <TopBar
        onProfilePress={() => onNavigate("profile")}
        onAIChatPress={() => onNavigate("ai-chat")}
      />

      {/* Title */}
      <div>
        <h1 className="font-serif text-dark" style={{ fontSize: "26px" }}>Community</h1>
        <p className="text-text-muted text-[13px] font-sans">Connect with other moms</p>
      </div>

      {/* Hero card */}
      <div className="hero-card p-5">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <IonIcon name="sparkles" size={18} style={{ color: "hsl(var(--coral))" }} />
            <span className="label-caps" style={{ color: "hsl(var(--coral))" }}>Featured</span>
          </div>
          <h3 className="text-white text-[18px] font-serif">Share your story</h3>
          <p className="text-white/60 text-[13px] font-sans mt-1">
            Join thousands of Nigerian moms sharing their pregnancy journey
          </p>
          <div className="flex items-center gap-2 mt-3">
            <IonIcon name="people" size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
            <span className="text-white/50 text-[12px] font-sans">12,400+ active members</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2.5 px-4 py-[12px] rounded-2xl"
        style={{ background: "hsl(var(--surface))", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
      >
        <IonIcon name="search" size={18} style={{ color: "hsl(var(--text-muted))" }} />
        <span className="text-text-muted text-[14px] font-sans">Search discussions...</span>
      </div>

      <div className="space-y-3">
        {posts.map((post, i) => (
          <CommunityCard key={i} {...post} />
        ))}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-6 w-[56px] h-[56px] rounded-full flex items-center justify-center z-40"
        style={{
          background: "hsl(var(--coral))",
          boxShadow: "0 6px 24px rgba(232,115,90,0.45)",
        }}
      >
        <IonIcon name="add" size={28} style={{ color: "white" }} />
      </motion.button>
    </div>
  );
};

export default CommunityScreen;

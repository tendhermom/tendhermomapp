import PregnancyCard from "@/components/cards/PregnancyCard";
import CommunityCard from "@/components/cards/CommunityCard";
import HealthTipChip from "@/components/chips/HealthTipChip";
import QuickAccessGrid from "@/components/QuickAccessGrid";
import TopBar from "@/components/navigation/TopBar";

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

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  return (
    <div className="space-y-6 pb-4">
      <TopBar
        onProfilePress={() => onNavigate("profile")}
        onAIChatPress={() => onNavigate("ai-chat")}
      />

      {/* Greeting */}
      <div>
        <p className="label-caps text-text-muted mb-0.5">Good morning</p>
        <h1 className="font-serif text-dark" style={{ fontSize: "26px" }}>
          Hello, Amara
        </h1>
      </div>

      {/* Pregnancy tracker */}
      <PregnancyCard />

      {/* Quick Access */}
      <div>
        <h2 className="font-serif text-dark text-[20px] mb-3">Quick Access</h2>
        <QuickAccessGrid onNavigate={onNavigate} />
      </div>

      {/* Community section */}
      <div>
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
            <CommunityCard
              key={i}
              {...post}
              onClick={() => onNavigate("community")}
            />
          ))}
        </div>
      </div>

      {/* Health tips */}
      <div className="space-y-2.5">
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
      </div>
    </div>
  );
};

export default HomeScreen;

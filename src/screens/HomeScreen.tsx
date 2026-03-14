import PregnancyCard from "@/components/cards/PregnancyCard";
import CommunityCard from "@/components/cards/CommunityCard";
import QuoteBlock from "@/components/cards/QuoteBlock";
import HealthTipChip from "@/components/chips/HealthTipChip";
import IonIcon from "@/components/IonIcon";

interface HomeScreenProps {
  onNavigate: (tab: string) => void;
  onOpenDrawer: () => void;
}

const communityPosts = [
  {
    title: "First-time moms support group",
    pill: "New Moms",
    preview: "Share your journey with other first-time moms. Tips, stories, and encouragement.",
    members: 2340,
  },
  {
    title: "Due in June 2026",
    pill: "Due Date",
    preview: "Connect with moms expecting around the same time as you!",
    members: 876,
  },
  {
    title: "Nigerian pregnancy recipes",
    pill: "Nutrition",
    preview: "Healthy Nigerian meals perfect for each trimester of pregnancy.",
    members: 1520,
  },
];

const HomeScreen = ({ onNavigate, onOpenDrawer }: HomeScreenProps) => {
  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onOpenDrawer} className="ios-press p-1">
            <IonIcon name="menu-outline" size={26} style={{ color: "hsl(var(--dark))" }} />
          </button>
          <div>
            <p className="label-caps text-text-muted mb-0.5">Good morning</p>
            <h1 className="font-serif text-dark" style={{ fontSize: "26px" }}>
              Hello, Amara
            </h1>
          </div>
        </div>
        <button
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center ios-press"
          style={{ background: "hsl(var(--light-green))" }}
        >
          <IonIcon name="notifications-outline" size={22} style={{ color: "hsl(var(--green))" }} />
        </button>
      </div>

      {/* Pregnancy tracker */}
      <PregnancyCard />

      {/* Community section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-dark text-[20px]">Community</h2>
          <button
            onClick={() => onNavigate("community")}
            className="flex items-center gap-0.5 ios-press"
          >
            <span className="text-[13px] font-semibold font-sans" style={{ color: "hsl(var(--green))" }}>See All</span>
            <IonIcon name="chevron-forward" size={14} style={{ color: "hsl(var(--green))" }} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-5 px-5">
          {communityPosts.map((post, i) => (
            <CommunityCard
              key={i}
              {...post}
              onClick={() => onNavigate("community")}
            />
          ))}
        </div>
      </div>

      {/* Quote */}
      <QuoteBlock quote="You're growing a human — rest when you can, you're doing beautifully." />

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
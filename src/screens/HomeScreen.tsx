import PregnancyCard from "@/components/cards/PregnancyCard";
import CommunityCard from "@/components/cards/CommunityCard";
import QuoteBlock from "@/components/cards/QuoteBlock";
import HealthTipChip from "@/components/chips/HealthTipChip";
import IonIcon from "@/components/IonIcon";

interface HomeScreenProps {
  onNavigate: (tab: string) => void;
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
    pill: "Due in June",
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

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="ios-footnote text-muted-foreground mb-0.5">Good morning</p>
          <h1 className="ios-large-title text-foreground" style={{ fontSize: "28px" }}>
            Hello, Amara 👋
          </h1>
        </div>
        <button
          className="w-[40px] h-[40px] rounded-full flex items-center justify-center ios-press"
          style={{ background: "hsla(153, 42%, 30%, 0.08)" }}
        >
          <IonIcon name="notifications-outline" size={22} style={{ color: "hsl(var(--forest))" }} />
        </button>
      </div>

      {/* Pregnancy tracker card */}
      <PregnancyCard />

      {/* Community section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="ios-title text-foreground">Community</h3>
          <button
            onClick={() => onNavigate("community")}
            className="flex items-center gap-0.5 ios-press"
          >
            <span className="ios-footnote font-medium" style={{ color: "hsl(var(--forest))" }}>See All</span>
            <IonIcon name="chevron-forward" size={14} style={{ color: "hsl(var(--forest))" }} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {communityPosts.map((post, i) => (
            <CommunityCard
              key={i}
              {...post}
              onClick={() => onNavigate("community")}
            />
          ))}
        </div>
      </div>

      {/* Daily Quote */}
      <QuoteBlock quote="You're growing a human—rest when you can." />

      {/* Health tips */}
      <div className="space-y-2.5">
        <h3 className="ios-title text-foreground">Today's Tips</h3>
        <HealthTipChip
          tip="💧 Drink 8 cups of water today!"
          onViewRecord={() => onNavigate("records")}
        />
        <HealthTipChip
          tip="🥑 Include folate-rich foods in your meals"
          onViewRecord={() => onNavigate("records")}
        />
      </div>
    </div>
  );
};

export default HomeScreen;

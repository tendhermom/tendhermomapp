import PregnancyCard from "@/components/cards/PregnancyCard";
import CommunityCard from "@/components/cards/CommunityCard";
import QuoteBlock from "@/components/cards/QuoteBlock";
import HealthTipChip from "@/components/chips/HealthTipChip";

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
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Hello, Amara 👋
        </h2>
        <p className="text-sm text-muted-foreground">
          Here's your pregnancy update
        </p>
      </div>

      <PregnancyCard />

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Community
        </h3>
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

      <QuoteBlock quote="You're growing a human—rest when you can." />

      <HealthTipChip
        tip="💧 Drink 8 cups of water today!"
        onViewRecord={() => onNavigate("records")}
      />

      <HealthTipChip
        tip="🥑 Include folate-rich foods in your meals"
        onViewRecord={() => onNavigate("records")}
      />
    </div>
  );
};

export default HomeScreen;

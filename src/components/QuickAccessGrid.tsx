import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";

interface QuickAccessGridProps {
  onNavigate: (screen: string) => void;
}

const quickActions = [
  { id: "records", icon: "document-text-outline", label: "Records", premium: false },
  { id: "appointments", icon: "calendar-outline", label: "Appointments", premium: false },
  { id: "antenatal", icon: "gift-outline", label: "Antenatal", premium: false },
  { id: "baby-shower", icon: "heart-circle-outline", label: "Baby Shower", premium: true },
];

const QuickAccessGrid = ({ onNavigate }: QuickAccessGridProps) => {
  const user = useAuthStore((s) => s.user);
  const isFree = user?.plan_type === "free";

  const handlePress = (action: typeof quickActions[0]) => {
    // Premium-gated features redirect free users to upgrade
    if (action.premium && isFree) {
      onNavigate("premium");
      return;
    }
    onNavigate(action.id);
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {quickActions.map((action) => (
        <motion.button
          key={action.id}
          whileTap={{ scale: 0.92 }}
          onClick={() => handlePress(action)}
          className="flex flex-col items-center gap-2 ios-press"
        >
          <div
            className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center relative"
            style={{
              background: action.premium
                ? "hsl(var(--light-coral))"
                : "hsl(var(--light-green))",
            }}
          >
            <IonIcon
              name={action.icon}
              size={24}
              style={{
                color: action.premium
                  ? "hsl(var(--coral))"
                  : "hsl(var(--green))",
              }}
            />
            {action.premium && isFree && (
              <div
                className="absolute -top-1 -right-1 w-[16px] h-[16px] rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--coral))" }}
              >
                <IonIcon name="lock-closed" size={8} style={{ color: "white" }} />
              </div>
            )}
          </div>
          <span className="text-[11px] font-semibold font-sans text-center" style={{ color: "hsl(var(--dark))" }}>
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickAccessGrid;

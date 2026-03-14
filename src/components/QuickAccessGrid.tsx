import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";

interface QuickAccessGridProps {
  onNavigate: (screen: string) => void;
}

const quickActions = [
  { id: "records", icon: "folder-open-outline", label: "Records", premium: false },
  { id: "appointments", icon: "calendar-outline", label: "Appointments", premium: false },
  { id: "antenatal", icon: "gift-outline", label: "Antenatal", premium: false },
  { id: "baby-shower", icon: "heart-circle-outline", label: "Baby Shower", premium: true },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.92 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 28 },
  },
};

const QuickAccessGrid = ({ onNavigate }: QuickAccessGridProps) => {
  const user = useAuthStore((s) => s.user);
  const isFree = user?.plan_type === "free";

  const handlePress = (action: typeof quickActions[0]) => {
    if (action.premium && isFree) {
      onNavigate("premium");
      return;
    }
    onNavigate(action.id);
  };

  return (
    <motion.div
      className="grid grid-cols-4 gap-3"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {quickActions.map((action) => (
        <motion.button
          key={action.id}
          variants={itemVariants}
          whileTap={{ scale: 0.88 }}
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
    </motion.div>
  );
};

export default QuickAccessGrid;

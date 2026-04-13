import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";
import { usePointsStore, getLevel } from "@/stores/pointsStore";

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

const GAMIFICATION_LEVELS = [
  { name: "Newbie Nest", min: 0, color: "hsl(340 82% 72%)", badge: "🌸" },
  { name: "Baby Steps", min: 50, color: "hsl(45 93% 58%)", badge: "🌻" },
  { name: "Mommy Mode", min: 150, color: "hsl(153 42% 30%)", badge: "💚" },
  { name: "Super Mom", min: 350, color: "hsl(210 80% 55%)", badge: "💙" },
  { name: "Mommy Master", min: 600, color: "hsl(270 60% 55%)", badge: "💜" },
];

const getGamificationLevel = (points: number) => {
  let level = GAMIFICATION_LEVELS[0];
  let index = 0;
  for (let i = 0; i < GAMIFICATION_LEVELS.length; i++) {
    if (points >= GAMIFICATION_LEVELS[i].min) {
      level = GAMIFICATION_LEVELS[i];
      index = i;
    }
  }
  return { ...level, index: index + 1 };
};

const menuItems = [
  { icon: "heart-outline", label: "Health Tracker", screen: "health-tracker", accent: "coral" },
  { icon: "location-outline", label: "Health Hubs", screen: "health-hubs", accent: "green" },
  { icon: "trophy-outline", label: "Levels & Rewards", screen: "gamification", accent: "green" },
  { icon: "gift-outline", label: "Baby Shower", screen: "baby-shower", accent: "coral" },
  { icon: "alert-circle-outline", label: "Emergency Contacts", screen: "emergency-contacts", accent: "coral" },
  { icon: "share-social-outline", label: "Refer a Friend", screen: "referral", accent: "green" },
];

const DrawerMenu = ({ isOpen, onClose, onNavigate }: DrawerMenuProps) => {
  const user = useAuthStore((s) => s.user);
  const userPoints = usePointsStore((s) => s.userPoints);
  const points = userPoints?.points || 0;
  const level = getGamificationLevel(points);
  const isPremium = user?.plan_type === "premium";

  const handleNavigate = (screen: string) => {
    onClose();
    onNavigate(screen);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed top-0 left-0 bottom-0 z-[101] w-[300px] flex flex-col"
            style={{
              background: "hsl(var(--bg))",
              boxShadow: "8px 0 32px rgba(0,0,0,0.12)",
            }}
          >
            {/* Header with user info */}
            <div
              className="pt-[calc(var(--safe-area-top,0px)+24px)] px-5 pb-5"
              style={{
                background: "linear-gradient(145deg, hsl(153 42% 22%), hsl(153 42% 30%))",
              }}
            >
              <button onClick={onClose} className="mb-4 ios-press">
                <IonIcon name="close" size={24} style={{ color: "rgba(255,255,255,0.7)" }} />
              </button>
              <div className="flex items-center gap-3">
                <div
                  className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-[20px] font-serif"
                  style={{
                    background: user?.avatar_url ? `url(${user.avatar_url}) center/cover` : "rgba(255,255,255,0.15)",
                    color: "white",
                  }}
                >
                  {!user?.avatar_url && (user?.full_name?.[0] || "M")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold font-sans text-[15px] truncate">{user?.full_name || "Mom"}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px]">{level.badge}</span>
                    <span className="text-[11px] font-sans font-medium" style={{ color: level.color }}>
                      {level.name}
                    </span>
                  </div>
                </div>
              </div>
              {/* Plan badge */}
              <div className="flex items-center gap-2 mt-3">
                <span
                  className="text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-[3px] rounded-full"
                  style={{
                    background: isPremium ? "rgba(232,115,90,0.2)" : "rgba(255,255,255,0.12)",
                    color: isPremium ? "hsl(var(--coral))" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {isPremium ? "Premium" : "Free Plan"}
                </span>
                <span className="text-[10px] font-sans font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {points} pts
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.screen}
                  onClick={() => handleNavigate(item.screen)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-[14px] ios-press text-left"
                  style={{ transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--light-green))")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center"
                    style={{
                      background: item.accent === "coral" ? "hsl(var(--light-coral))" : "hsl(var(--light-green))",
                    }}
                  >
                    <IonIcon
                      name={item.icon}
                      size={18}
                      style={{ color: item.accent === "coral" ? "hsl(var(--coral))" : "hsl(var(--green))" }}
                    />
                  </div>
                  <span className="text-[14px] font-sans font-medium flex-1" style={{ color: "hsl(var(--dark))" }}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 safe-area-bottom" style={{ borderTop: "1px solid hsl(var(--border-subtle))" }}>
              <button
                onClick={() => handleNavigate("profile")}
                className="flex items-center gap-2 ios-press"
              >
                <IonIcon name="settings-outline" size={18} style={{ color: "hsl(var(--text-muted))" }} />
                <span className="text-[13px] font-sans font-medium" style={{ color: "hsl(var(--text-muted))" }}>
                  Settings & Profile
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DrawerMenu;

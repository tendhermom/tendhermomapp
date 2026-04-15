import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

interface TopBarProps {
  onNotificationsPress?: () => void;
  onAIChatPress?: () => void;
}

const TopBar = ({ onNotificationsPress, onAIChatPress }: TopBarProps) => {
  const unreadCount = useUnreadNotifications();

  return (
    <div className="flex items-center justify-between mb-5">
      <div />

      {/* Right - AI Chat + Notifications */}
      <div className="flex items-center gap-2">
        {onAIChatPress && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onAIChatPress}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-full ios-press"
            style={{
              background: "linear-gradient(135deg, hsl(var(--coral)), hsl(11 74% 56%))",
              boxShadow: "0 4px 16px -4px hsla(11, 74%, 56%, 0.4)",
            }}
          >
            <IonIcon name="sparkles" size={16} style={{ color: "white" }} />
            <span className="text-[12px] font-sans font-bold text-white tracking-wide">AI</span>
          </motion.button>
        )}

        {onNotificationsPress && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onNotificationsPress}
            className="w-[40px] h-[40px] rounded-full flex items-center justify-center ios-press relative"
            style={{ background: "hsl(var(--light-green))" }}
          >
            <IonIcon name="notifications-outline" size={20} style={{ color: "hsl(var(--green))" }} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold font-sans px-1"
                style={{ background: "hsl(var(--coral))", color: "white" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default TopBar;

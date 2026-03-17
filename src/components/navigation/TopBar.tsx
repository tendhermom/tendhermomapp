import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

interface TopBarProps {
  onNotificationsPress?: () => void;
  onMenuPress?: () => void;
  onAIChatPress?: () => void;
}

const TopBar = ({ onNotificationsPress, onMenuPress, onAIChatPress }: TopBarProps) => {
  const unreadCount = useUnreadNotifications();

  return (
    <div className="flex items-center justify-between mb-5">
      {/* Left - Hamburger menu */}
      <div className="flex items-center">
        {onMenuPress && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onMenuPress}
            className="w-[40px] h-[40px] rounded-full flex items-center justify-center ios-press"
            style={{ background: "hsl(var(--light-green))" }}
          >
            <IonIcon name="menu-outline" size={20} style={{ color: "hsl(var(--green))" }} />
          </motion.button>
        )}
      </div>

      {/* Right - AI Chat + Notifications */}
      <div className="flex items-center gap-2">
        {onAIChatPress && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onAIChatPress}
            className="w-[40px] h-[40px] rounded-full flex items-center justify-center ios-press"
            style={{ background: "hsl(var(--light-coral))" }}
          >
            <IonIcon name="chatbubble-ellipses-outline" size={18} style={{ color: "hsl(var(--coral))" }} />
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

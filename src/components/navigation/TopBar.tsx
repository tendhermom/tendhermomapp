import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

interface TopBarProps {
  onProfilePress: () => void;
  onAIChatPress: () => void;
  onNotificationsPress?: () => void;
  initials?: string;
}

const TopBar = ({ onProfilePress, onAIChatPress, onNotificationsPress, initials = "AO" }: TopBarProps) => {
  const unreadCount = useUnreadNotifications();

  return (
    <div className="flex items-center justify-between mb-5">
      {/* Profile avatar */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onProfilePress}
        className="w-[40px] h-[40px] rounded-full flex items-center justify-center ios-press"
        style={{ background: "hsl(var(--green))" }}
      >
        <span className="text-white text-[14px] font-bold font-sans">{initials}</span>
      </motion.button>

      <div className="flex items-center gap-2">
        {/* Notifications */}
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

        {/* AI Chat */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onAIChatPress}
          className="w-[40px] h-[40px] rounded-full flex items-center justify-center ios-press"
          style={{ background: "hsl(var(--light-green))" }}
        >
          <IonIcon name="chatbox-ellipses-outline" size={20} style={{ color: "hsl(var(--green))" }} />
        </motion.button>
      </div>
    </div>
  );
};

export default TopBar;

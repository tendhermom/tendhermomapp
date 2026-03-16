import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

interface TopBarProps {
  onNotificationsPress?: () => void;
}

const TopBar = ({ onNotificationsPress }: TopBarProps) => {
  const unreadCount = useUnreadNotifications();

  return (
    <div className="flex items-center justify-end mb-5">
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
    </div>
  );
};

export default TopBar;

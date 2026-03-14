import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface TopBarProps {
  onProfilePress: () => void;
  onAIChatPress: () => void;
  initials?: string;
}

const TopBar = ({ onProfilePress, onAIChatPress, initials = "AO" }: TopBarProps) => {
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

      {/* AI Chat */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onAIChatPress}
        className="w-[40px] h-[40px] rounded-full flex items-center justify-center ios-press"
        style={{ background: "hsl(var(--light-green))" }}
      >
        <IonIcon name="sparkles-outline" size={20} style={{ color: "hsl(var(--green))" }} />
      </motion.button>
    </div>
  );
};

export default TopBar;

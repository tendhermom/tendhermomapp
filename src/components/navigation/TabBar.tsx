import { memo } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { hapticSelection } from "@/lib/despia";

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  { id: "triage", label: "Triage", icon: "fitness-outline", activeIcon: "fitness" },
  { id: "sos", label: "SOS", icon: "pulse-outline", activeIcon: "pulse" },
  { id: "community", label: "Community", icon: "chatbubbles-outline", activeIcon: "chatbubbles" },
  { id: "profile", label: "Profile", icon: "person-circle-outline", activeIcon: "person-circle" },
];

const TabBar = memo(({ activeTab, onTabChange }: TabBarProps) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-50">
      <div className="nav-glass" style={{ borderTop: "0.5px solid hsl(var(--border))" }}>
        <div
          className="flex items-end justify-around safe-area-bottom"
          style={{ paddingTop: "8px", paddingBottom: "max(env(safe-area-inset-bottom, 20px), 20px)" }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isSOS = tab.id === "sos";

            if (isSOS) {
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => {
                    hapticSelection();
                    onTabChange(tab.id);
                  }}
                  className="flex flex-col items-center -mt-6 relative"
                >
                  <div
                    className="w-[60px] h-[60px] rounded-full flex items-center justify-center"
                    style={{
                      background: "hsl(var(--coral))",
                      boxShadow: "0 4px 20px rgba(232,115,90,0.5), 0 0 0 5px hsla(30,14%,96%,0.95)",
                    }}
                  >
                    <IonIcon
                      name={isActive ? "pulse" : "pulse-outline"}
                      size={28}
                      style={{ color: "white" }}
                    />
                  </div>
                </motion.button>
              );
            }

            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.85 }}
                onClick={() => {
                  hapticSelection();
                  onTabChange(tab.id);
                }}
                className="flex flex-col items-center gap-[3px] min-w-[60px] py-1 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -top-[8px] w-5 h-[3px] rounded-full"
                    style={{ background: "hsl(var(--green))" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <IonIcon
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={24}
                  style={{
                    color: isActive ? "hsl(var(--green))" : "hsl(var(--text-muted))",
                  }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: isActive ? "hsl(var(--green))" : "hsl(var(--text-muted))",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

TabBar.displayName = "TabBar";

export default TabBar;

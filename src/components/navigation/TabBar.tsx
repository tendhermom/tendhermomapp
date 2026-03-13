import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  { id: "community", label: "Community", icon: "people-outline", activeIcon: "people" },
  { id: "sos", label: "SOS", icon: "warning-outline", activeIcon: "warning" },
  { id: "consult", label: "Consult", icon: "calendar-outline", activeIcon: "calendar" },
  { id: "records", label: "Records", icon: "document-text-outline", activeIcon: "document-text" },
];

const TabBar = ({ activeTab, onTabChange }: TabBarProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div
        className="ios-blur border-t"
        style={{
          background: "hsla(0, 0%, 100%, 0.85)",
          borderColor: "hsla(0, 0%, 0%, 0.08)",
        }}
      >
        <div className="flex items-end justify-around max-w-lg mx-auto safe-area-bottom"
          style={{ paddingTop: "6px", paddingBottom: "max(env(safe-area-inset-bottom, 20px), 20px)" }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isSOS = tab.id === "sos";

            if (isSOS) {
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onTabChange(tab.id)}
                  className="flex flex-col items-center -mt-4 relative"
                >
                  <div
                    className="w-[50px] h-[50px] rounded-full flex items-center justify-center mb-0.5"
                    style={{
                      background: "hsl(var(--coral))",
                      boxShadow: "0 4px 14px hsla(11, 74%, 63%, 0.4)",
                    }}
                  >
                    <IonIcon
                      name={isActive ? "warning" : "warning-outline"}
                      size={24}
                      style={{ color: "white" }}
                    />
                  </div>
                  <span
                    className="ios-caption font-medium"
                    style={{ color: "hsl(var(--coral))" }}
                  >
                    {tab.label}
                  </span>
                </motion.button>
              );
            }

            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.85 }}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center gap-0.5 min-w-[64px] py-1 relative"
              >
                <div className="relative h-[28px] flex items-center justify-center">
                  <IonIcon
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={25}
                    style={{
                      color: isActive
                        ? "hsl(var(--forest))"
                        : "hsl(var(--text-tertiary))",
                    }}
                  />
                </div>
                <span
                  className="ios-caption"
                  style={{
                    color: isActive
                      ? "hsl(var(--forest))"
                      : "hsl(var(--text-tertiary))",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "10px",
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
};

export default TabBar;

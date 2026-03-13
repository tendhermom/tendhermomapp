import { Home, Users, AlertTriangle, Calendar, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "community", label: "Community", icon: Users },
  { id: "sos", label: "SOS", icon: AlertTriangle },
  { id: "consult", label: "Consult", icon: Calendar },
  { id: "records", label: "Records", icon: FileText },
];

const TabBar = ({ activeTab, onTabChange }: TabBarProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="flex items-end justify-around px-2 pb-6 pt-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isSOS = tab.id === "sos";
          const Icon = tab.icon;

          if (isSOS) {
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-lg mb-1">
                  <Icon size={24} className="text-accent-foreground" />
                </div>
                <span className="text-[10px] font-medium text-accent">
                  {tab.label}
                </span>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 py-1"
            >
              <Icon
                size={22}
                className={isActive ? "text-primary" : "text-muted-foreground"}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default TabBar;

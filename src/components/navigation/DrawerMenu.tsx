import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: string) => void;
}

const menuItems = [
  { label: "AI Health Chat", icon: "sparkles-outline", route: "ai-chat" },
  { label: "My Appointments", icon: "calendar-outline", route: "appointments" },
  { label: "Health Records", icon: "document-text-outline", route: "records" },
  { label: "Profile", icon: "person-circle-outline", route: "profile" },
];

const secondaryItems = [
  { label: "Get Premium", icon: "diamond-outline", route: "premium", accent: true },
  { label: "Notifications", icon: "notifications-outline", route: "notifications" },
  { label: "Language", icon: "globe-outline", route: "language" },
  { label: "Privacy & Security", icon: "shield-checkmark-outline", route: "privacy" },
  { label: "Help & Support", icon: "help-circle-outline", route: "help" },
];

const DrawerMenu = ({ isOpen, onClose, onNavigate }: DrawerMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="drawer-overlay"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-[100] w-[300px] max-w-[80vw] flex flex-col"
            style={{ background: "hsl(var(--bg))" }}
          >
            {/* Header */}
            <div
              className="px-5 pt-14 pb-6 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, hsl(153, 42%, 30%) 0%, hsl(153, 42%, 22%) 100%)" }}
            >
              <div className="absolute top-[-20px] right-[-20px] w-[80px] h-[80px] rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="absolute bottom-[-15px] left-[-15px] w-[60px] h-[60px] rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
              
              <div className="relative z-10">
                <div
                  className="w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <span className="text-white font-bold text-[18px]">AO</span>
                </div>
                <h3 className="text-white font-sans font-semibold text-[17px]">Amara Okafor</h3>
                <p className="text-white/60 text-[13px] mt-0.5">amara@email.com</p>
                <span
                  className="inline-flex items-center gap-1 mt-2 px-2.5 py-[3px] rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: "hsl(var(--coral))", color: "white" }}
                >
                  <IonIcon name="diamond" size={10} style={{ color: "white" }} />
                  Free Plan
                </span>
              </div>
            </div>

            {/* Menu items */}
            <div className="flex-1 overflow-y-auto py-3">
              <div className="px-3">
                {menuItems.map((item) => (
                  <button
                    key={item.route}
                    onClick={() => { onNavigate?.(item.route); onClose(); }}
                    className="flex items-center gap-3 w-full px-3 py-[13px] rounded-xl transition-colors hover:bg-light-green ios-press"
                  >
                    <IonIcon name={item.icon} size={22} style={{ color: "hsl(var(--green))" }} />
                    <span className="text-dark text-[15px] font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="mx-5 my-2 h-[1px] bg-border" />

              <div className="px-3">
                {secondaryItems.map((item) => (
                  <button
                    key={item.route}
                    onClick={() => { onNavigate?.(item.route); onClose(); }}
                    className="flex items-center gap-3 w-full px-3 py-[13px] rounded-xl transition-colors hover:bg-light-green ios-press"
                  >
                    <IonIcon
                      name={item.icon}
                      size={22}
                      style={{ color: item.accent ? "hsl(var(--coral))" : "hsl(var(--text-muted))" }}
                    />
                    <span
                      className="text-[15px] font-medium"
                      style={{ color: item.accent ? "hsl(var(--coral))" : "hsl(var(--dark))" }}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mx-5 my-2 h-[1px] bg-border" />

              <div className="px-3">
                <button
                  onClick={onClose}
                  className="flex items-center gap-3 w-full px-3 py-[13px] rounded-xl transition-colors hover:bg-light-coral ios-press"
                >
                  <IonIcon name="log-out-outline" size={22} style={{ color: "hsl(var(--destructive))" }} />
                  <span className="text-[15px] font-medium text-destructive">Log Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DrawerMenu;
import { useState } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import TopBar from "@/components/navigation/TopBar";
import RecordsScreen from "@/screens/RecordsScreen";
import ReferralScreen from "@/screens/ReferralScreen";

interface ProfileScreenProps {
  onNavigate: (tab: string) => void;
}

const menuSections = [
  {
    items: [
      { icon: "calendar-outline", label: "My Appointments", value: "2 upcoming", route: "appointments" },
      { icon: "document-text-outline", label: "Health Records", value: "", route: "records" },
      { icon: "gift-outline", label: "Referral Programme", value: "3/10", route: "referral" },
      { icon: "heart-outline", label: "Saved Articles", value: "12", route: "" },
    ],
  },
  {
    items: [
      { icon: "diamond-outline", label: "Get Premium", value: "", accent: true, route: "premium" },
      { icon: "notifications-outline", label: "Notifications", value: "", route: "notifications" },
      { icon: "globe-outline", label: "Language", value: "English", route: "" },
    ],
  },
  {
    items: [
      { icon: "shield-checkmark-outline", label: "Privacy & Security", value: "", route: "privacy" },
      { icon: "help-circle-outline", label: "Help & Support", value: "", route: "help" },
    ],
  },
];

const ProfileScreen = ({ onNavigate }: ProfileScreenProps) => {
  const [subScreen, setSubScreen] = useState<string | null>(null);

  if (subScreen === "records") {
    return <RecordsScreen onNavigate={onNavigate} onBack={() => setSubScreen(null)} />;
  }
  if (subScreen === "referral") {
    return <ReferralScreen onBack={() => setSubScreen(null)} />;
  }

  const handleMenuPress = (route: string) => {
    if (route === "records" || route === "referral") {
      setSubScreen(route);
    } else if (route) {
      onNavigate(route);
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <TopBar
        onProfilePress={() => {}}
        onAIChatPress={() => onNavigate("ai-chat")}
      />

      {/* Profile hero card */}
      <div className="hero-card p-5">
        <div className="relative z-10 flex items-center gap-4">
          <div
            className="w-[64px] h-[64px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <span className="text-white text-[22px] font-bold font-sans">AO</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white text-[20px] font-serif">Amara Okafor</h3>
            <p className="text-white/60 text-[13px] font-sans mt-0.5">amara@email.com</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="label-caps px-2.5 py-[3px] rounded-full"
                style={{ background: "hsl(var(--coral))", color: "white" }}
              >
                Week 24
              </span>
              <span
                className="label-caps px-2.5 py-[3px] rounded-full"
                style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
              >
                Free Plan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu sections */}
      {menuSections.map((section, si) => (
        <div key={si} className="tend-card overflow-hidden">
          {section.items.map((item, i) => (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleMenuPress(item.route)}
              className="flex items-center gap-3.5 w-full px-[18px] py-[15px] text-left ios-press"
              style={{
                borderBottom: i < section.items.length - 1
                  ? "0.5px solid hsl(var(--border))"
                  : "none",
              }}
            >
              <IonIcon
                name={item.icon}
                size={22}
                style={{ color: item.accent ? "hsl(var(--coral))" : "hsl(var(--green))" }}
              />
              <span
                className="flex-1 text-[15px] font-medium font-sans"
                style={{ color: item.accent ? "hsl(var(--coral))" : "hsl(var(--dark))" }}
              >
                {item.label}
              </span>
              {item.value && (
                <span className="text-text-muted text-[13px] font-sans mr-1">{item.value}</span>
              )}
              <IonIcon name="chevron-forward" size={16} style={{ color: "hsl(var(--border))" }} />
            </motion.button>
          ))}
        </div>
      ))}

      {/* Log out */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        className="w-full tend-card py-[15px] flex items-center justify-center gap-2 ios-press"
      >
        <IonIcon name="log-out-outline" size={20} style={{ color: "hsl(var(--destructive))" }} />
        <span className="text-destructive text-[15px] font-semibold font-sans">Log Out</span>
      </motion.button>
    </div>
  );
};

export default ProfileScreen;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import TopBar from "@/components/navigation/TopBar";
import EditProfileScreen from "@/screens/EditProfileScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import { useAuthStore } from "@/stores/authStore";
import { nativeShare, hapticLight } from "@/lib/despia";

interface ProfileScreenProps {
  onNavigate: (tab: string) => void;
}

const menuSections = [
  {
    items: [
      { icon: "alert-circle-outline", label: "Emergency Contacts", route: "emergency-contacts" },
      { icon: "notifications-outline", label: "Notifications", route: "notifications" },
      { icon: "share-social-outline", label: "Share TendherMom", route: "share-app" },
    ],
  },
  {
    items: [
      { icon: "shield-checkmark-outline", label: "Privacy & Security", route: "privacy" },
      { icon: "help-circle-outline", label: "Help & Support", route: "help" },
      { icon: "document-text-outline", label: "Terms of Service", route: "terms" },
    ],
  },
];

const ProfileScreen = ({ onNavigate }: ProfileScreenProps) => {
  const [subScreen, setSubScreen] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const { logout, getCurrentWeek } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const week = getCurrentWeek();
  const stageName = user?.current_stage?.replace(/_/g, " ") || "First trimester";

  if (subScreen === "edit-profile") {
    return <EditProfileScreen onBack={() => setSubScreen(null)} />;
  }
  if (subScreen === "notifications") {
    return <NotificationsScreen onBack={() => setSubScreen(null)} />;
  }

  const handleMenuPress = (route: string) => {
    hapticLight();
    if (route === "share-app") {
      nativeShare({
        title: "TendherMom",
        text: "Join TendherMom — maternal health support for Nigerian mothers 🤰",
        url: "https://tendhermomapp.lovable.app",
      });
      return;
    }
    if (["edit-profile", "notifications"].includes(route)) {
      setSubScreen(route);
    } else if (route) {
      onNavigate(route);
    }
  };

  return (
    <div className="space-y-6 pb-4 pt-1">
      <TopBar onNotificationsPress={() => setSubScreen("notifications")} />

      {/* Profile hero card */}
      <div className="hero-card p-5">
        <div className="relative z-10 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSubScreen("edit-profile")}
            className="w-[64px] h-[64px] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-[22px] font-bold font-sans">{initials}</span>
            )}
          </motion.button>
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-[20px] font-serif truncate">{user?.full_name || "User"}</h3>
            <p className="text-white/60 text-[13px] font-sans mt-0.5 truncate">{user?.email || ""}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="label-caps px-2.5 py-[3px] rounded-full"
                style={{ background: "hsl(var(--coral))", color: "white" }}
              >
                Week {week}
              </span>
              <span
                className="label-caps px-2.5 py-[3px] rounded-full capitalize"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}
              >
                {stageName}
              </span>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSubScreen("edit-profile")}
            className="p-2"
          >
            <IonIcon name="create-outline" size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
          </motion.button>
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
              className="flex items-center gap-3.5 w-full px-[18px] py-[15px] text-left"
              style={{
                borderBottom: i < section.items.length - 1
                  ? "0.5px solid hsl(var(--border))"
                  : "none",
              }}
            >
              <IonIcon name={item.icon} size={22} style={{ color: "hsl(var(--green))" }} />
              <span className="flex-1 text-[15px] font-medium font-sans" style={{ color: "hsl(var(--dark))" }}>
                {item.label}
              </span>
              <IonIcon name="chevron-forward" size={16} style={{ color: "hsl(var(--border))" }} />
            </motion.button>
          ))}
        </div>
      ))}

      {/* App version */}
      <div className="text-center">
        <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
          TendherMom v1.0.0
        </p>
      </div>

      {/* Log out */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleLogout}
        className="w-full tend-card py-[15px] flex items-center justify-center gap-2"
      >
        <IonIcon name="log-out-outline" size={20} style={{ color: "hsl(var(--destructive))" }} />
        <span className="text-destructive text-[15px] font-semibold font-sans">Log Out</span>
      </motion.button>
    </div>
  );
};

export default ProfileScreen;

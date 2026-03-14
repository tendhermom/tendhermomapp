import { useState, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TabBar from "@/components/navigation/TabBar";
import HomeScreen from "@/screens/HomeScreen";
import CommunityScreen from "@/screens/CommunityScreen";
import SOSScreen from "@/screens/SOSScreen";
import ConsultScreen from "@/screens/ConsultScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import PremiumScreen from "@/screens/PremiumScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import RemindersScreen from "@/screens/RemindersScreen";
import BabyShowerScreen from "@/screens/BabyShowerScreen";
import EmergencyContactsScreen from "@/screens/EmergencyContactsScreen";
import AIChatScreen from "@/screens/AIChatScreen";
import RecordsScreen from "@/screens/RecordsScreen";
import { useAuthStore } from "@/stores/authStore";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const user = useAuthStore((s) => s.user);
  const isFree = user?.plan_type === "free";

  const handleNavigate = (screen: string) => {
    // Premium-gated screens redirect free users to upgrade
    const premiumScreens = ["ai-chat", "baby-shower", "consult"];
    if (premiumScreens.includes(screen) && isFree) {
      setActiveTab("premium");
      return;
    }

    // Quick access routing
    if (screen === "records" || screen === "antenatal") {
      setActiveTab("profile");
      return;
    }

    setActiveTab(screen);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen onNavigate={handleNavigate} />;
      case "community":
        return <CommunityScreen onNavigate={handleNavigate} />;
      case "sos":
        return <SOSScreen onNavigate={handleNavigate} />;
      case "emergency-contacts":
        return <EmergencyContactsScreen onBack={() => setActiveTab("sos")} />;
      case "consult":
        return <ConsultScreen onNavigate={handleNavigate} />;
      case "profile":
        return <ProfileScreen onNavigate={handleNavigate} />;
      case "premium":
        return <PremiumScreen onBack={() => setActiveTab("home")} />;
      case "reminders":
        return <RemindersScreen onBack={() => setActiveTab("home")} />;
      case "baby-shower":
        return <BabyShowerScreen onBack={() => setActiveTab("home")} />;
      case "notifications":
        return <NotificationsScreen onBack={() => setActiveTab("home")} />;
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-foreground/5 flex justify-center">
      <div className="app-shell">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="screen-scroll"
          >
            <div className="px-5 pt-14 pb-8">
              {renderScreen()}
            </div>
          </motion.div>
        </AnimatePresence>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;

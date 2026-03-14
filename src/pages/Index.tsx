import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TabBar from "@/components/navigation/TabBar";
import HomeScreen from "@/screens/HomeScreen";
import CommunityScreen from "@/screens/CommunityScreen";
import SOSScreen from "@/screens/SOSScreen";
import ConsultScreen from "@/screens/ConsultScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import PremiumScreen from "@/screens/PremiumScreen";
import { useAuthStore } from "@/stores/authStore";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const user = useAuthStore((s) => s.user);
  const isFree = user?.plan_type === "free";

  const handleNavigate = (screen: string) => {
    // Premium-gated screens redirect free users to upgrade
    const premiumScreens = ["ai-chat", "baby-shower"];
    if (premiumScreens.includes(screen) && isFree) {
      setActiveTab("premium");
      return;
    }

    // Quick access routing
    if (screen === "records" || screen === "antenatal") {
      setActiveTab("profile");
      return;
    }
    if (screen === "appointments") {
      setActiveTab("consult");
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
        return <SOSScreen />;
      case "consult":
        return <ConsultScreen onNavigate={handleNavigate} />;
      case "profile":
        return <ProfileScreen onNavigate={handleNavigate} />;
      case "premium":
        return <PremiumScreen onBack={() => setActiveTab("home")} />;
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

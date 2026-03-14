import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TabBar from "@/components/navigation/TabBar";
import HomeScreen from "@/screens/HomeScreen";
import CommunityScreen from "@/screens/CommunityScreen";
import SOSScreen from "@/screens/SOSScreen";
import ConsultScreen from "@/screens/ConsultScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import RecordsScreen from "@/screens/RecordsScreen";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const handleNavigate = (screen: string) => {
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
      case "records":
        return <RecordsScreen onNavigate={handleNavigate} onBack={() => setActiveTab("profile")} />;
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

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TabBar from "@/components/navigation/TabBar";
import DrawerMenu from "@/components/navigation/DrawerMenu";
import HomeScreen from "@/screens/HomeScreen";
import CommunityScreen from "@/screens/CommunityScreen";
import SOSScreen from "@/screens/SOSScreen";
import ConsultScreen from "@/screens/ConsultScreen";
import ProfileScreen from "@/screens/ProfileScreen";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen onNavigate={setActiveTab} onOpenDrawer={() => setDrawerOpen(true)} />;
      case "community":
        return <CommunityScreen onOpenDrawer={() => setDrawerOpen(true)} />;
      case "sos":
        return <SOSScreen />;
      case "consult":
        return <ConsultScreen onOpenDrawer={() => setDrawerOpen(true)} />;
      case "profile":
        return <ProfileScreen onOpenDrawer={() => setDrawerOpen(true)} />;
      default:
        return <HomeScreen onNavigate={setActiveTab} onOpenDrawer={() => setDrawerOpen(true)} />;
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
        <DrawerMenu
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </div>
    </div>
  );
};

export default Index;
import { useState, useEffect, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TabBar from "@/components/navigation/TabBar";
import { StatusBarThemes, hapticSelection } from "@/lib/despia";

// Lazy-load all screens
const HomeScreen = lazy(() => import("@/screens/HomeScreen"));
const TriageScreen = lazy(() => import("@/screens/TriageScreen"));
const SOSScreen = lazy(() => import("@/screens/SOSScreen"));
const CommunityScreen = lazy(() => import("@/screens/CommunityScreen"));
const BabyShowerScreen = lazy(() => import("@/screens/BabyShowerScreen"));
const ProfileScreen = lazy(() => import("@/screens/ProfileScreen"));
const NotificationsScreen = lazy(() => import("@/screens/NotificationsScreen"));
const EmergencyContactsScreen = lazy(() => import("@/screens/EmergencyContactsScreen"));

const ScreenFallback = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
  </div>
);

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const handleNavigate = (screen: string) => {
    setActiveTab(screen);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen onNavigate={handleNavigate} />;
      case "triage":
        return <TriageScreen onNavigate={handleNavigate} />;
      case "sos":
        return <SOSScreen onNavigate={handleNavigate} />;
      case "community":
        return <CommunityScreen onNavigate={handleNavigate} />;
      case "baby-shower":
        return <BabyShowerScreen onBack={() => setActiveTab("home")} />;
      case "profile":
        return <ProfileScreen onNavigate={handleNavigate} />;
      case "notifications":
        return <NotificationsScreen onBack={() => setActiveTab("home")} />;
      case "emergency-contacts":
        return <EmergencyContactsScreen onBack={() => setActiveTab("sos")} />;
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
              <Suspense fallback={<ScreenFallback />}>
                {renderScreen()}
              </Suspense>
            </div>
          </motion.div>
        </AnimatePresence>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;

import { useState, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TabBar from "@/components/navigation/TabBar";
import { useAuthStore } from "@/stores/authStore";

// Lazy-load all screens for code splitting
const HomeScreen = lazy(() => import("@/screens/HomeScreen"));
const CommunityScreen = lazy(() => import("@/screens/CommunityScreen"));
const SOSScreen = lazy(() => import("@/screens/SOSScreen"));
const ConsultScreen = lazy(() => import("@/screens/ConsultScreen"));
const ProfileScreen = lazy(() => import("@/screens/ProfileScreen"));
const PremiumScreen = lazy(() => import("@/screens/PremiumScreen"));
const NotificationsScreen = lazy(() => import("@/screens/NotificationsScreen"));
const RemindersScreen = lazy(() => import("@/screens/RemindersScreen"));
const BabyShowerScreen = lazy(() => import("@/screens/BabyShowerScreen"));
const EmergencyContactsScreen = lazy(() => import("@/screens/EmergencyContactsScreen"));
const AIChatScreen = lazy(() => import("@/screens/AIChatScreen"));
const RecordsScreen = lazy(() => import("@/screens/RecordsScreen"));

const ScreenFallback = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
  </div>
);

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const user = useAuthStore((s) => s.user);
  const isFree = user?.plan_type === "free";

  const handleNavigate = (screen: string) => {
    const premiumScreens = ["ai-chat", "baby-shower", "consult"];
    if (premiumScreens.includes(screen) && isFree) {
      setActiveTab("premium");
      return;
    }
    if (screen === "antenatal") {
      setActiveTab("records");
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
      case "ai-chat":
        return <AIChatScreen onBack={() => setActiveTab("home")} />;
      case "records":
        return <RecordsScreen onBack={() => setActiveTab("home")} />;
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

import { useState, useEffect, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TabBar from "@/components/navigation/TabBar";
import DrawerMenu from "@/components/navigation/DrawerMenu";
import { StatusBarThemes, hapticSelection } from "@/lib/despia";
import { useAuthStore } from "@/stores/authStore";

// Lazy-load all screens
const HomeScreen = lazy(() => import("@/screens/HomeScreen"));
const TriageScreen = lazy(() => import("@/screens/TriageScreen"));
const SOSScreen = lazy(() => import("@/screens/SOSScreen"));
const CommunityScreen = lazy(() => import("@/screens/CommunityScreen"));
const BabyShowerScreen = lazy(() => import("@/screens/BabyShowerScreen"));
const ProfileScreen = lazy(() => import("@/screens/ProfileScreen"));
const NotificationsScreen = lazy(() => import("@/screens/NotificationsScreen"));
const EmergencyContactsScreen = lazy(() => import("@/screens/EmergencyContactsScreen"));
const OnboardingScreen = lazy(() => import("@/screens/OnboardingScreen"));
const HealthTrackerScreen = lazy(() => import("@/screens/HealthTrackerScreen"));
const AIChatScreen = lazy(() => import("@/screens/AIChatScreen"));
const GamificationScreen = lazy(() => import("@/screens/GamificationScreen"));
const AppointmentsScreen = lazy(() => import("@/screens/AppointmentsScreen"));

const ScreenFallback = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
  </div>
);

const Index = () => {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState("home");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Show onboarding for new users (no LMP set and hasn't completed onboarding)
  useEffect(() => {
    if (user && !user.lmp_date && !user.due_date && !localStorage.getItem("onboarding_completed")) {
      setShowOnboarding(true);
    }
  }, [user]);

  // Theme status bar based on active screen
  useEffect(() => {
    const emergencyScreens = ["sos", "emergency-contacts"];
    const lightScreens = ["community", "baby-shower"];
    if (emergencyScreens.includes(activeTab)) {
      StatusBarThemes.emergency();
    } else if (lightScreens.includes(activeTab)) {
      StatusBarThemes.light();
    } else {
      StatusBarThemes.primary();
    }
  }, [activeTab]);

  const handleNavigate = (screen: string) => {
    hapticSelection();
    setActiveTab(screen);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen onNavigate={handleNavigate} onMenuOpen={() => setDrawerOpen(true)} />;
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
      case "health-tracker":
        return <HealthTrackerScreen onNavigate={handleNavigate} />;
      case "ai-chat":
        return <AIChatScreen onBack={() => setActiveTab("home")} />;
      case "gamification":
        return <GamificationScreen onBack={() => setActiveTab("home")} />;
      case "appointments":
        return <AppointmentsScreen onBack={() => setActiveTab("home")} />;
      default:
        return <HomeScreen onNavigate={handleNavigate} onMenuOpen={() => setDrawerOpen(true)} />;
    }
  };

  if (showOnboarding) {
    return (
      <Suspense fallback={<ScreenFallback />}>
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-foreground/5 flex justify-center">
      <div className="app-shell">
        <DrawerMenu
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onNavigate={handleNavigate}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="screen-scroll"
          >
            <div className="px-5 pb-8" style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 56px)" }}>
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

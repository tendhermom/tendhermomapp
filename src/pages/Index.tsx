import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TabBar from "@/components/navigation/TabBar";
import { StatusBarThemes, hapticSelection } from "@/lib/despia";
import { useAuthStore } from "@/stores/authStore";

// Eagerly load the 5 main tab screens for instant navigation
import HomeScreen from "@/screens/HomeScreen";
import TriageScreen from "@/screens/TriageScreen";
import SOSScreen from "@/screens/SOSScreen";
import CommunityScreen from "@/screens/CommunityScreen";
import ProfileScreen from "@/screens/ProfileScreen";

// Lazy-load secondary screens only
const BabyShowerScreen = lazy(() => import("@/screens/BabyShowerScreen"));
const NotificationsScreen = lazy(() => import("@/screens/NotificationsScreen"));
const EmergencyContactsScreen = lazy(() => import("@/screens/EmergencyContactsScreen"));
const OnboardingScreen = lazy(() => import("@/screens/OnboardingScreen"));
const HealthTrackerScreen = lazy(() => import("@/screens/HealthTrackerScreen"));
const AIChatScreen = lazy(() => import("@/screens/AIChatScreen"));
const GamificationScreen = lazy(() => import("@/screens/GamificationScreen"));
const HealthHubsScreen = lazy(() => import("@/screens/HealthHubsScreen"));
const PremiumScreen = lazy(() => import("@/screens/PremiumScreen"));
const ModerationScreen = lazy(() => import("@/screens/ModerationScreen"));
const ReferralScreen = lazy(() => import("@/screens/ReferralScreen"));
const AntenatalScreen = lazy(() => import("@/screens/AntenatalScreen"));
const InsightsScreen = lazy(() => import("@/screens/InsightsScreen"));

const prefetchScreens = () => {
  requestIdleCallback?.(() => {
    import("@/screens/AIChatScreen");
    import("@/screens/HealthTrackerScreen");
    import("@/screens/BabyShowerScreen");
    import("@/screens/AntenatalScreen");
  }) ?? setTimeout(() => {
    import("@/screens/AIChatScreen");
    import("@/screens/HealthTrackerScreen");
    import("@/screens/BabyShowerScreen");
    import("@/screens/AntenatalScreen");
  }, 2000);
};

const ScreenFallback = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
  </div>
);

// Tabs live at the root of the stack — tapping a tab resets the stack.
const ROOT_TABS = new Set(["home", "triage", "sos", "community", "profile"]);
const NAV_STORAGE_KEY = "tendher_nav_v1";
const NAV_TTL_MS = 15 * 60 * 1000; // 15 minutes

const readPersistedStack = (): string[] | null => {
  try {
    const raw = localStorage.getItem(NAV_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { stack?: string[]; ts?: number };
    if (!parsed?.stack?.length || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > NAV_TTL_MS) return null;
    return parsed.stack;
  } catch {
    return null;
  }
};

const Index = () => {
  const user = useAuthStore((s) => s.user);
  const [stack, setStack] = useState<string[]>(() => readPersistedStack() ?? ["home"]);
  const stackRef = useRef(stack);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const activeTab = stack[stack.length - 1] ?? "home";

  useEffect(() => { stackRef.current = stack; }, [stack]);

  useEffect(() => { prefetchScreens(); }, []);

  // Persist the nav stack (with timestamp) so resuming within 15 min lands
  // on the same screen instead of being reset to Home.
  useEffect(() => {
    try {
      localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ stack, ts: Date.now() }));
    } catch {}
  }, [stack]);

  useEffect(() => {
    if (!user || localStorage.getItem("onboarding_completed")) return;
    if (!user.lmp_date && !user.due_date) {
      setShowOnboarding(true);
    }
  }, [user]);

  useEffect(() => {
    const emergencyScreens = ["sos", "emergency-contacts"];
    const lightScreens = ["community", "baby-shower"];
    const surfaceScreens = ["profile", "premium", "referrals", "moderation", "notifications"];
    if (emergencyScreens.includes(activeTab)) {
      StatusBarThemes.emergency();
    } else if (lightScreens.includes(activeTab)) {
      StatusBarThemes.light();
    } else if (surfaceScreens.includes(activeTab)) {
      StatusBarThemes.surface();
    } else {
      StatusBarThemes.primary();
    }
  }, [activeTab]);

  const pushBrowserHistory = useCallback(() => {
    try { window.history.pushState({ tendher: true }, ""); } catch {}
  }, []);

  const handleNavigate = useCallback((screen: string) => {
    hapticSelection();
    setStack((prev) => {
      const current = prev[prev.length - 1];
      if (screen === current) return prev;
      // Tabs are roots — tapping a tab resets the stack to that tab.
      if (ROOT_TABS.has(screen)) return [screen];
      return [...prev, screen];
    });
    pushBrowserHistory();
  }, [pushBrowserHistory]);

  const handleBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  // Hardware / browser back button — pop our stack instead of exiting the app.
  useEffect(() => {
    // Seed a history entry we own so the first back press fires popstate
    // instead of leaving the app.
    try { window.history.pushState({ tendher: true, seed: true }, ""); } catch {}

    const onPop = () => {
      if (stackRef.current.length > 1) {
        setStack((prev) => prev.slice(0, -1));
        // Re-seed so the next back press also fires popstate.
        try { window.history.pushState({ tendher: true }, ""); } catch {}
      } else {
        // At root — confirm before letting the shell exit.
        const shouldExit = window.confirm("Exit TendherMom?");
        if (!shouldExit) {
          try { window.history.pushState({ tendher: true }, ""); } catch {}
        }
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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
        return <BabyShowerScreen onBack={handleBack} onNavigate={handleNavigate} />;
      case "profile":
        return <ProfileScreen onNavigate={handleNavigate} />;
      case "notifications":
        return <NotificationsScreen onBack={handleBack} />;
      case "emergency-contacts":
        return <EmergencyContactsScreen onBack={handleBack} />;
      case "health-tracker":
        return <HealthTrackerScreen onNavigate={handleNavigate} />;
      case "ai-chat":
        return <AIChatScreen onBack={handleBack} onNavigate={handleNavigate} />;
      case "gamification":
        return <GamificationScreen onBack={handleBack} />;
      case "health-hubs":
        return <HealthHubsScreen onBack={handleBack} onNavigate={handleNavigate} />;
      case "premium":
        return <PremiumScreen onBack={handleBack} />;
      case "moderation":
        return <ModerationScreen onBack={handleBack} />;
      case "referrals":
        return <ReferralScreen onBack={handleBack} />;
      case "antenatal":
        return <AntenatalScreen onNavigate={handleNavigate} />;
      case "insights":
        return <InsightsScreen onBack={handleBack} />;
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="screen-scroll"
          >
            <div className="px-5 pb-8" style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 56px)" }}>
              <Suspense fallback={<ScreenFallback />}>
                {renderScreen()}
              </Suspense>
            </div>
          </motion.div>
        </AnimatePresence>
        <TabBar activeTab={activeTab} onTabChange={handleNavigate} />
      </div>
    </div>
  );
};

export default Index;

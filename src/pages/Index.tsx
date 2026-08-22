import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TabBar from "@/components/navigation/TabBar";
import { StatusBarThemes, hapticSelection } from "@/lib/despia";
import { consumePendingDeepLink, onDeepLink } from "@/lib/deeplinks";
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
const NAV_TTL_MS = 60 * 60 * 1000; // 1 hour

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

  const handleNavigate = useCallback((screen: string) => {
    hapticSelection();
    setStack((prev) => {
      const current = prev[prev.length - 1];
      if (screen === current) return prev;
      // Tabs are roots — tapping a tab resets the stack to that tab.
      if (ROOT_TABS.has(screen)) return [screen];
      return [...prev, screen];
    });
    // No history.pushState here: a single sentinel entry (seeded below) is
    // enough to catch the hardware back press. Pushing one entry per screen
    // made exiting require many back presses and felt like the app hung.
  }, []);


  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  // When the mum confirms Exit we stop re-seeding the sentinel so the
  // WebView's history is exhausted and the shell can finish the app.
  const exitGuardDisarmed = useRef(false);

  const confirmExit = useCallback(() => {
    setExitPromptOpen(false);
    exitGuardDisarmed.current = true;
    // Unwind every history entry we own. history.go() clamps at the first
    // entry, so this lands on the app's root load with canGoBack = false —
    // the next back press (or the shell) then closes the app instead of
    // re-opening the prompt.
    try { window.history.go(-(window.history.length - 1)); } catch { try { window.history.back(); } catch {} }
    // Belt-and-braces: close() works where the shell allows script closing.
    setTimeout(() => { try { window.close(); } catch {} }, 150);
  }, []);

  const handleBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  // Deep links — tendhermom:// and https://tendhermomapps.lovable.app/go/<target>
  useEffect(() => {
    const goTo = (target: { screen: string; params?: Record<string, string> }) => {
      if (target.params?.post) {
        try { sessionStorage.setItem("tendher_deeplink_post", target.params.post); } catch {}
      }
      setStack((prev) => {
        if (prev[prev.length - 1] === target.screen) return prev;
        return ROOT_TABS.has(target.screen) ? [target.screen] : [...prev, target.screen];
      });
    };

    const pending = consumePendingDeepLink();
    if (pending) goTo(pending);
    return onDeepLink(goTo);
  }, []);

  // Hardware / browser back button — pop our stack instead of exiting the app.
  useEffect(() => {
    // Seed exactly one history entry we own so a back press fires popstate
    // instead of leaving the app.
    try { window.history.pushState({ tendher: true, seed: true }, ""); } catch {}

    const onPop = () => {
      // Exit was confirmed — the guard is disarmed, so let pops unwind the
      // history without re-seeding or re-opening the prompt.
      if (exitGuardDisarmed.current) return;
      if (stackRef.current.length > 1) {
        setStack((prev) => prev.slice(0, -1));
        // Re-seed a single entry so the next back press also fires popstate.
        try { window.history.pushState({ tendher: true }, ""); } catch {}
        return;
      }
      // At a root tab: confirm before leaving so an accidental back press
      // never drops a mum out of the app mid-task.
      try { window.history.pushState({ tendher: true }, ""); } catch {}
      setExitPromptOpen(true);
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

        {/* Exit confirmation — root-level back press */}
        <AnimatePresence>
          {exitPromptOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[95] flex items-end justify-center"
              style={{ background: "rgba(0,0,0,0.45)" }}
              onClick={() => setExitPromptOpen(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[430px] rounded-t-3xl px-5 pt-5"
                style={{
                  background: "hsl(var(--surface))",
                  paddingBottom: "max(env(safe-area-inset-bottom, 24px), 24px)",
                }}
              >
                <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "hsl(var(--border-subtle))" }} />
                <h3 className="font-serif text-[20px] text-center" style={{ color: "hsl(var(--dark))" }}>
                  Leave TendherMom?
                </h3>
                <p className="text-[13px] font-sans text-center mt-1.5" style={{ color: "hsl(var(--text-muted))" }}>
                  You can come back any time — we're here for you.
                </p>
                <div className="flex gap-3 mt-5">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setExitPromptOpen(false)}
                    className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold font-sans"
                    style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
                  >
                    Stay
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={confirmExit}
                    className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold font-sans"
                    style={{ background: "hsl(var(--green))", color: "white" }}
                  >
                    Exit
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;

import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import SplashScreen from "./components/SplashScreen";
import BiometricLock from "./components/BiometricLock";
import PhoneBackfillPrompt from "./components/PhoneBackfillPrompt";
import OfflineBanner from "./components/OfflineBanner";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const TechnicalPopups = lazy(() => import("./pages/TechnicalPopups"));
const HealthSafety = lazy(() => import("./pages/HealthSafety"));

const Index = lazy(() => import("./pages/Index"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--bg))" }}>
    <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
  </div>
);

const AuthListener = () => {
  const { fetchProfile, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Refresh last_active_at so the inactivity check-in safety net knows the user is active.
    const touchActivity = () => {
      supabase.rpc("touch_last_active").then(({ error }) => {
        if (error) console.warn("[activity] touch failed:", error.message);
      });
    };

    // If the user signs back in within the 7-day grace window, auto-cancel the pending deletion.
    const cancelPendingDeletionIfAny = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("deletion_requested_at")
          .eq("id", userId)
          .maybeSingle();
        if (data && (data as any).deletion_requested_at) {
          await supabase.functions.invoke("delete-account", {
            body: { cancel: true },
          });
          try { localStorage.removeItem("deletion_pending"); } catch (_) {}
          // Re-fetch the freshly-restored profile
          fetchProfile(userId);
          // Lightweight toast — Sonner is loaded elsewhere; fall back to console if not.
          import("sonner").then(({ toast }) => {
            toast.success("Welcome back — your account deletion was cancelled.");
          }).catch(() => {});
        }
      } catch (err) {
        console.warn("[deletion] cancel-on-login failed:", err);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          localStorage.setItem("has_logged_in", "true");
          fetchProfile(session.user.id);
          touchActivity();
          cancelPendingDeletionIfAny(session.user.id);
          import("./lib/onesignal").then(({ setOneSignalExternalUserId }) => {
            setOneSignalExternalUserId(session.user.id);
          });
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
        touchActivity();
        cancelPendingDeletionIfAny(session.user.id);
        import("./lib/onesignal").then(({ setOneSignalExternalUserId }) => {
          setOneSignalExternalUserId(session.user.id);
        });
      } else {
        setLoading(false);
      }
    });

    // Re-touch when the app returns to foreground (covers long sessions kept open in background).
    const onVisible = () => {
      if (document.visibilityState === "visible") touchActivity();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
};

const AppContent = () => {
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return <LoadingSpinner />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<Suspense fallback={<LoadingSpinner />}><Privacy /></Suspense>} />
      <Route path="/terms" element={<Suspense fallback={<LoadingSpinner />}><Terms /></Suspense>} />
      <Route path="/technical-popups" element={<Suspense fallback={<LoadingSpinner />}><TechnicalPopups /></Suspense>} />
      <Route path="/health-safety" element={<Suspense fallback={<LoadingSpinner />}><HealthSafety /></Suspense>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner />}>
              <Index />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const IntroScreen = lazy(() => import("./screens/IntroScreen"));

const safeLocalGet = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch (_) { return null; }
};

const App = () => {
  const hasLoggedInBefore = safeLocalGet("has_logged_in") === "true";
  const [splashDone, setSplashDone] = useState(hasLoggedInBefore);
  const [introDone, setIntroDone] = useState(() => hasLoggedInBefore || safeLocalGet("intro_completed") === "true");
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);
  const handleIntroComplete = useCallback(() => setIntroDone(true), []);

  // Show splash/intro first for new users before anything else
  if (!splashDone) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SplashScreen onFinish={handleSplashFinish} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (!introDone) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <IntroScreen onComplete={handleIntroComplete} />
          </Suspense>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OfflineBanner />
        <BiometricLock />
        <SonnerToaster />
        <BrowserRouter>
          <AuthListener />
          <AppContent />
          <PhoneBackfillPrompt />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

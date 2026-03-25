import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
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

const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id);
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
        import("./lib/onesignal").then(({ setOneSignalExternalUserId }) => {
          setOneSignalExternalUserId(session.user.id);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
};

const AppContent = ({ initialRoute }: { initialRoute?: string }) => {
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
      {initialRoute && <Route path="*" element={<Navigate to={initialRoute} replace />} />}
      {!initialRoute && <Route path="*" element={<NotFound />} />}
    </Routes>
  );
};

const IntroScreen = lazy(() => import("./screens/IntroScreen"));

const App = () => {
  const [splashDone, setSplashDone] = useState(false);
  const [introDone, setIntroDone] = useState(() => localStorage.getItem("intro_completed") === "true");
  const [freshIntro, setFreshIntro] = useState(false);
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);
  const handleIntroComplete = useCallback(() => {
    setIntroDone(true);
    setFreshIntro(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
        {splashDone && !introDone && (
          <Suspense fallback={<LoadingSpinner />}>
            <IntroScreen onComplete={handleIntroComplete} />
          </Suspense>
        )}
        <BiometricLock />
        <BrowserRouter>
          <AuthListener />
          <AppContent initialRoute={freshIntro ? "/signup" : undefined} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

import { useState, useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import OnboardingScreen from "./screens/OnboardingScreen";
import TermsScreen from "./screens/TermsScreen";

const Index = lazy(() => import("./pages/Index"));
const ExpertDashboard = lazy(() => import("./screens/ExpertDashboard"));
const ExpertPendingScreen = lazy(() => import("./screens/ExpertPendingScreen"));
const AdminDashboard = lazy(() => import("./screens/AdminDashboard"));

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

const AppContent = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isExpertApproved, setIsExpertApproved] = useState(false);
  const [rolesChecked, setRolesChecked] = useState(false);

  // Check user roles when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setRolesChecked(false);
      setIsAdmin(false);
      setIsExpertApproved(false);
      return;
    }

    const checkRoles = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roles = (data || []).map((r: any) => r.role);
      setIsAdmin(roles.includes("admin"));
      setIsExpertApproved(roles.includes("expert"));
      setRolesChecked(true);
    };

    checkRoles();
  }, [isAuthenticated, user?.id]);

  if (isLoading) return <LoadingSpinner />;

  // Check if current path is /admin
  const isAdminRoute = window.location.pathname.startsWith("/admin");

  // Show onboarding if authenticated but profile has no due_date and no lmp_date (fresh signup) and is a mother
  const needsOnboarding = isAuthenticated && user && !user.due_date && !user.lmp_date && !onboardingDone
    && user.user_type === "mother";

  // Expert who just signed up (user_type not set yet, or just registered)
  const isNewUser = isAuthenticated && user && !user.due_date && !user.lmp_date && !onboardingDone
    && user.user_type !== "mother";

  // For new users (no onboarding data), always show onboarding
  const showOnboarding = isAuthenticated && user && !user.due_date && !user.lmp_date && !onboardingDone;

  // Show terms after onboarding completes (for mother signups only)
  const needsTerms = isAuthenticated && user && onboardingDone && !termsAccepted && user.user_type === "mother";

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setOnboardingDone(true)} />;
  }

  if (needsTerms) {
    return (
      <TermsScreen
        onAccept={() => setTermsAccepted(true)}
        onDecline={() => {
          useAuthStore.getState().logout();
        }}
      />
    );
  }

  // Expert user routing
  if (isAuthenticated && user?.user_type === "expert" && !isAdminRoute) {
    if (!rolesChecked) return <LoadingSpinner />;
    if (isExpertApproved) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <ExpertDashboard />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ExpertPendingScreen />
      </Suspense>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner />}>
              {rolesChecked && isAdmin ? (
                <AdminDashboard />
              ) : rolesChecked ? (
                <NotFound />
              ) : (
                <LoadingSpinner />
              )}
            </Suspense>
          </ProtectedRoute>
        }
      />
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthListener />
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

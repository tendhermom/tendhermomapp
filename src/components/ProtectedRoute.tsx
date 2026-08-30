import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    // Same branded moment as the boot shield / splash — never a different visual.
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--bg))" }}>
        <img src="/boot-logo.jpg" alt="TendherMom" className="h-28 w-28 rounded-[26px] object-contain animate-pulse" />
      </div>
    );
  }


  if (!session) {
    // First-time users (just completed intro, never logged in) go to signup
    const hasLoggedInBefore = localStorage.getItem("has_logged_in") === "true";
    return <Navigate to={hasLoggedInBefore ? "/login" : "/signup"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

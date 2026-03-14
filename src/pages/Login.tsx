import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import IonIcon from "@/components/IonIcon";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

const Login = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex justify-center" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-[430px] px-6 pt-16 pb-8 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex-1 flex flex-col"
        >
          {/* Header */}
          <div className="mb-10">
            <h1 className="font-serif text-[32px] leading-tight" style={{ color: "hsl(var(--dark))" }}>
              Welcome back
            </h1>
            <p className="text-[15px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
              Sign in to continue your journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[12px] font-sans font-semibold mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full px-4 py-3 rounded-xl text-[15px] font-sans outline-none transition-shadow"
                style={{
                  background: "hsl(var(--surface))",
                  color: "hsl(var(--dark))",
                  border: "1.5px solid hsl(var(--border))",
                }}
              />
            </div>
            <div>
              <label className="text-[12px] font-sans font-semibold mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl text-[15px] font-sans outline-none pr-12"
                  style={{
                    background: "hsl(var(--surface))",
                    color: "hsl(var(--dark))",
                    border: "1.5px solid hsl(var(--border))",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <IonIcon name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} style={{ color: "hsl(var(--text-muted))" }} />
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-[13px] font-sans font-semibold" style={{ color: "hsl(var(--green))" }}>
                Forgot password?
              </Link>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold font-sans ios-press flex items-center justify-center gap-2"
              style={{ background: "hsl(var(--green))", color: "white", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[14px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              Don't have an account?{" "}
              <Link to="/signup" className="font-semibold" style={{ color: "hsl(var(--green))" }}>
                Sign Up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

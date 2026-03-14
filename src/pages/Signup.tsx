import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import IonIcon from "@/components/IonIcon";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

const Signup = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || password.length < 6) {
      toast.error("Please fill all fields. Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to verify.");
      navigate("/login");
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setLoading(false);
    if (error) toast.error(String(error));
  };

  return (
    <div className="min-h-screen flex justify-center" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-[430px] px-6 pt-14 pb-8 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex-1 flex flex-col"
        >
          <div className="mb-8">
            <h1 className="font-serif text-[32px] leading-tight" style={{ color: "hsl(var(--dark))" }}>
              Create account
            </h1>
            <p className="text-[15px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
              Start your pregnancy journey with Tend
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 font-sans font-semibold text-[15px] ios-press mb-5"
            style={{
              background: "hsl(var(--surface))",
              color: "hsl(var(--dark))",
              boxShadow: "0 2px 12px -3px hsla(0,0%,0%,0.08)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </motion.button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
            <span className="text-[12px] font-sans font-medium" style={{ color: "hsl(var(--text-muted))" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
          </div>

          <form onSubmit={handleSignup} className="space-y-3.5">
            <div>
              <label className="text-[12px] font-sans font-semibold mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Amara Okafor"
                required
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl text-[15px] font-sans outline-none"
                style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", border: "1.5px solid hsl(var(--border))" }}
              />
            </div>
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
                maxLength={255}
                className="w-full px-4 py-3 rounded-xl text-[15px] font-sans outline-none"
                style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", border: "1.5px solid hsl(var(--border))" }}
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
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl text-[15px] font-sans outline-none pr-12"
                  style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", border: "1.5px solid hsl(var(--border))" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <IonIcon name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} style={{ color: "hsl(var(--text-muted))" }} />
                </button>
              </div>
            </div>
            <div>
              <label className="text-[12px] font-sans font-semibold mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
                Expected Due Date <span className="font-normal" style={{ color: "hsl(var(--text-muted))" }}>(optional)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-[15px] font-sans outline-none"
                style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", border: "1.5px solid hsl(var(--border))" }}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold font-sans ios-press flex items-center justify-center"
              style={{ background: "hsl(var(--green))", color: "white", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Creating account…" : "Create Account"}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[14px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              Already have an account?{" "}
              <Link to="/login" className="font-semibold" style={{ color: "hsl(var(--green))" }}>
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;

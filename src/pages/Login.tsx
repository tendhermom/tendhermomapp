import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import IonIcon from "@/components/IonIcon";
import InlineStatus, { type InlineStatusMsg } from "@/components/InlineStatus";
import { useAuthStore } from "@/stores/authStore";
import heroImg from "@/assets/auth-login-hero.png";
import logo from "@/assets/logo.jpeg";

const SPARKLES = [
  { top: "15%", left: "-6%", delay: 0, dur: 2.4 },
  { top: "55%", left: "96%", delay: 0.5, dur: 2.8 },
  { top: "80%", left: "-4%", delay: 1, dur: 2.2 },
];

const transientAuthError = (message: string) => {
  const normalized = message.toLowerCase();
  return normalized.includes("server") || normalized.includes("network") || normalized.includes("fetch") || normalized.includes("timeout");
};

const Login = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [status, setStatus] = useState<InlineStatusMsg | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setShowResend(false);
    setStatus(null);
    const credentials = { email: email.trim(), password };
    let error: any = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await supabase.auth.signInWithPassword(credentials);
        error = result.error;
      } catch (err) {
        error = err;
      }
      if (!error || !transientAuthError(error.message || "")) break;
      await new Promise((resolve) => setTimeout(resolve, 700));
    }

    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) setShowResend(true);
      const message = transientAuthError(error.message || "")
        ? "We could not reach the login server. Please check your connection and try again."
        : error.message;
      setStatus({ kind: "error", text: message });
    } else {
      try { localStorage.setItem("has_logged_in", "true"); } catch (_) {}
      navigate("/");
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) { setStatus({ kind: "error", text: "Please enter your email first" }); return; }
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    setResending(false);
    if (error) setStatus({ kind: "error", text: error.message });
    else { setStatus({ kind: "success", text: "Verification email sent! Check your inbox." }); setShowResend(false); }
  };

  return (
    <div className="min-h-screen flex justify-center overflow-y-auto" style={{ background: "#FFFFFF" }}>
      <div className="w-full max-w-[430px] flex flex-col" style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 12px)" }}>

        {/* ── Premium Illustration Hero ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="relative flex items-center justify-center pt-6 pb-2"
        >
          {/* Radial glow */}
          <div
            className="absolute rounded-full blur-[60px] opacity-30"
            style={{
              width: 220, height: 220,
              background: "radial-gradient(circle, hsl(var(--green)), transparent 70%)",
              transform: "scale(1.3)",
            }}
          />
          {/* Floating illustration */}
          <motion.img
            src={heroImg}
            alt=""
            className="relative w-[180px] h-[180px] object-contain drop-shadow-lg"
            animate={{ y: [0, -8, 0], rotate: [0, -1.5, 0, 1.5, 0] }}
            transition={{
              y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
            draggable={false}
          />
          {/* Sparkle particles */}
          {SPARKLES.map((s, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{ background: "hsl(var(--green))", top: s.top, left: s.left, opacity: 0.5 }}
              animate={{ y: [0, -12, 0], opacity: [0.3, 0.7, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: s.dur, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
            />
          ))}
        </motion.div>

        {/* ── Content ── */}
        <div className="flex-1 px-6 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.15 }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img src={logo} alt="" className="w-7 h-7 rounded-lg object-contain" />
                <span className="text-[12px] font-sans font-medium tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>
                  TendherMom
                </span>
              </div>
              <h1 className="font-serif text-[28px] leading-tight tracking-[-0.01em]" style={{ color: "hsl(var(--dark))" }}>
                Welcome back
              </h1>
              <p className="text-[14px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                Sign in to continue your journey
              </p>
            </div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex justify-center gap-2 mb-6"
            >
              {[
                { icon: "pulse-outline", label: "Health Tracker" },
                { icon: "people-outline", label: "Community" },
                { icon: "chatbubble-outline", label: "AI Chat" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                  style={{ background: "hsl(var(--surface))", boxShadow: "0 2px 12px -2px hsla(var(--dark), 0.06)" }}
                >
                  <IonIcon name={f.icon} size={12} style={{ color: "hsl(var(--green))" }} />
                  <span className="text-[10px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>{f.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <label className="text-[12px] font-sans font-semibold mb-1.5 block tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <IonIcon name="mail-outline" size={18} style={{ color: "hsl(var(--text-muted))" }} />
                  </div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-[15px] font-sans outline-none transition-all focus:ring-2"
                    style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", boxShadow: "inset 0 1px 3px hsla(var(--dark), 0.04)", "--tw-ring-color": "hsla(var(--green), 0.3)" } as any}
                  />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <label className="text-[12px] font-sans font-semibold mb-1.5 block tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <IonIcon name="lock-closed-outline" size={18} style={{ color: "hsl(var(--text-muted))" }} />
                  </div>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                    className="w-full pl-10 pr-12 py-3.5 rounded-2xl text-[15px] font-sans outline-none transition-all focus:ring-2"
                    style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", boxShadow: "inset 0 1px 3px hsla(var(--dark), 0.04)", "--tw-ring-color": "hsla(var(--green), 0.3)" } as any}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5">
                    <IonIcon name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} style={{ color: "hsl(var(--text-muted))" }} />
                  </button>
                </div>
              </motion.div>

              <div className="flex justify-end pt-0.5">
                <Link to="/forgot-password" className="text-[13px] font-sans font-semibold" style={{ color: "hsl(var(--green))" }}>
                  Forgot password?
                </Link>
              </div>

              {showResend && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="rounded-2xl p-3.5 flex items-center gap-3" style={{ background: "hsla(var(--coral), 0.08)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsla(var(--coral), 0.12)" }}>
                    <IonIcon name="mail-unread-outline" size={18} style={{ color: "hsl(var(--coral))" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>Email not verified yet</p>
                  </div>
                  <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={handleResendVerification} disabled={resending}
                    className="px-3.5 py-2 rounded-xl text-[12px] font-sans font-semibold"
                    style={{ background: "hsl(var(--coral))", color: "white", opacity: resending ? 0.6 : 1 }}>
                    {resending ? "Sending…" : "Resend"}
                  </motion.button>
                </motion.div>
              )}

              <InlineStatus status={status} spacing="" />

              <motion.button
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
                className="w-full py-4 rounded-2xl text-[15px] font-semibold font-sans flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 22%))",
                  color: "white", opacity: loading ? 0.7 : 1,
                  boxShadow: "0 6px 24px -6px hsla(153, 42%, 30%, 0.4)",
                }}>
                {loading ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <>Sign In <IonIcon name="arrow-forward" size={16} style={{ color: "white" }} /></>}
              </motion.button>
            </form>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-center">
              <p className="text-[14px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                Don't have an account?{" "}
                <Link to="/signup" className="font-semibold" style={{ color: "hsl(var(--green))" }}>Sign Up</Link>
              </p>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              className="mt-5 text-center text-[11px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
              By signing in, you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;

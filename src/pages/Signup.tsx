import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import IonIcon from "@/components/IonIcon";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import heroMumImg from "@/assets/auth-signup-hero.png";
import heroExpertImg from "@/assets/auth-expert.png";
import logo from "@/assets/logo.jpeg";

type UserType = "mother" | "expert";

const SPARKLES_GREEN = [
  { top: "12%", left: "-5%", delay: 0, dur: 2.4 },
  { top: "50%", left: "97%", delay: 0.5, dur: 2.8 },
  { top: "82%", left: "-3%", delay: 1, dur: 2.2 },
];
const SPARKLES_CORAL = [
  { top: "18%", left: "96%", delay: 0.2, dur: 2.6 },
  { top: "55%", left: "-6%", delay: 0.7, dur: 2.3 },
  { top: "78%", left: "95%", delay: 1.2, dur: 2.5 },
];

const Signup = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

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
        data: { full_name: fullName.trim(), user_type: userType },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { setOtpSent(true); toast.success("Verification code sent to your email!"); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { toast.error("Please enter the 6-digit code."); return; }
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: otp, type: "signup" });
    setVerifying(false);
    if (error) toast.error(error.message);
    else toast.success("Email verified! Welcome to TendherMom");
  };

  const handleResend = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Verification code resent!");
  };

  // ─── OTP Verification ───
  if (otpSent) {
    return (
      <div className="min-h-screen flex justify-center" style={{ background: "hsl(var(--bg))" }}>
        <div className="w-full max-w-[430px] px-6 flex flex-col" style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 12px)" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex-1 flex flex-col pt-4">
            <button onClick={() => setOtpSent(false)} className="mb-6 self-start flex items-center gap-1.5">
              <IonIcon name="chevron-back" size={22} style={{ color: "hsl(var(--dark))" }} />
              <span className="text-[15px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>Back</span>
            </button>
            <motion.div className="flex justify-center mb-6" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }}>
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-[30px]" style={{ background: "hsla(var(--green), 0.15)", transform: "scale(2)" }} />
                <div className="relative w-20 h-20 rounded-[24px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsla(var(--green), 0.12), hsla(var(--green), 0.06))", boxShadow: "0 8px 32px -8px hsla(var(--green), 0.15)" }}>
                  <IonIcon name="mail-open-outline" size={36} style={{ color: "hsl(var(--green))" }} />
                </div>
              </div>
            </motion.div>
            <div className="text-center mb-8">
              <h1 className="font-serif text-[26px] leading-tight tracking-[-0.01em]" style={{ color: "hsl(var(--dark))" }}>Verify your email</h1>
              <p className="text-[14px] font-sans mt-2 max-w-[280px] mx-auto" style={{ color: "hsl(var(--text-muted))" }}>
                We sent a 6-digit code to <span className="font-semibold" style={{ color: "hsl(var(--dark))" }}>{email}</span>
              </p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" autoFocus
                className="w-full px-4 py-4 rounded-2xl text-[24px] font-sans text-center tracking-[0.6em] outline-none transition-all focus:ring-2"
                style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", boxShadow: "inset 0 1px 3px hsla(var(--dark), 0.04)", "--tw-ring-color": "hsla(var(--green), 0.3)" } as any} />
              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={verifying || otp.length < 6}
                className="w-full py-4 rounded-2xl text-[15px] font-semibold font-sans flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 22%))", color: "white", opacity: verifying || otp.length < 6 ? 0.5 : 1, boxShadow: "0 6px 24px -6px hsla(153, 42%, 30%, 0.4)" }}>
                {verifying ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <>Verify Email <IonIcon name="checkmark-circle-outline" size={18} style={{ color: "white" }} /></>}
              </motion.button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                Didn't receive the code?{" "}
                <button onClick={handleResend} disabled={loading} className="font-semibold" style={{ color: "hsl(var(--green))" }}>{loading ? "Sending…" : "Resend"}</button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── STEP 1: Role Selection with Premium Illustrations ───
  if (!userType) {
    return (
      <div className="min-h-screen flex justify-center" style={{ background: "hsl(var(--bg))" }}>
        <div className="w-full max-w-[430px] flex flex-col" style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 12px)" }}>
          <div className="flex-1 px-6 pb-8 flex flex-col">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              {/* Header */}
              <div className="text-center mb-6 pt-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <img src={logo} alt="" className="w-7 h-7 rounded-lg object-contain" />
                  <span className="text-[12px] font-sans font-medium tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>TendherMom</span>
                </div>
                <h1 className="font-serif text-[28px] leading-tight tracking-[-0.01em]" style={{ color: "hsl(var(--dark))" }}>
                  How will you use<br /><span style={{ color: "hsl(var(--green))" }}>TendherMom?</span>
                </h1>
                <p className="text-[14px] font-sans mt-1.5" style={{ color: "hsl(var(--text-muted))" }}>
                  Choose your role to get started
                </p>
              </div>

              {/* Role Cards */}
              <div className="space-y-4">
                {/* Mum Card */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setUserType("mother")}
                  className="w-full rounded-3xl p-5 text-left relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--light-green)), hsla(var(--green), 0.08))",
                    border: "2px solid hsla(var(--green), 0.2)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 rounded-full blur-[20px] opacity-25" style={{ background: "hsl(var(--green))", transform: "scale(1.5)" }} />
                      <motion.img
                        src={heroMumImg}
                        alt=""
                        className="relative w-[85px] h-[85px] object-contain"
                        animate={{ y: [0, -4, 0], rotate: [0, -1, 0, 1, 0] }}
                        transition={{ y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
                        draggable={false}
                      />
                    </div>
                    <div className="pt-1 flex-1">
                      <h3 className="font-serif text-[20px] mb-1" style={{ color: "hsl(var(--dark))" }}>I'm a Mum</h3>
                      <p className="text-[13px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
                        Track your pregnancy, join communities & get health guidance.
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {["Health Tracker", "SOS", "Community", "AI Chat"].map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold"
                            style={{ background: "hsla(var(--green), 0.15)", color: "hsl(var(--green))" }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <IonIcon name="arrow-forward-circle" size={28} style={{ color: "hsl(var(--green))" }} />
                  </div>
                </motion.button>

                {/* Expert Card */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setUserType("expert")}
                  className="w-full rounded-3xl p-5 text-left relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, hsla(var(--coral), 0.08), hsla(var(--coral), 0.04))",
                    border: "2px solid hsla(var(--coral), 0.15)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 rounded-full blur-[20px] opacity-25" style={{ background: "hsl(var(--coral))", transform: "scale(1.5)" }} />
                      <motion.img
                        src={heroExpertImg}
                        alt=""
                        className="relative w-[85px] h-[85px] object-contain"
                        animate={{ y: [0, -4, 0], rotate: [0, 1, 0, -1, 0] }}
                        transition={{ y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
                        draggable={false}
                      />
                    </div>
                    <div className="pt-1 flex-1">
                      <h3 className="font-serif text-[20px] mb-1" style={{ color: "hsl(var(--dark))" }}>I'm a Health Expert</h3>
                      <p className="text-[13px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
                        Manage availability, accept bookings & consult with mothers.
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {["Calendar", "Bookings", "Consultations"].map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold"
                            style={{ background: "hsla(var(--coral), 0.15)", color: "hsl(var(--coral))" }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <IonIcon name="arrow-forward-circle" size={28} style={{ color: "hsl(var(--coral))" }} />
                  </div>
                </motion.button>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 text-center">
                <p className="text-[14px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold" style={{ color: "hsl(var(--green))" }}>Sign In</Link>
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 2: Registration Form with Intro-style Hero ───
  const isMum = userType === "mother";
  const heroImg = isMum ? heroMumImg : heroExpertImg;
  const accentColor = isMum ? "hsl(var(--green))" : "hsl(var(--coral))";
  const accentVar = isMum ? "--green" : "--coral";
  const sparkles = isMum ? SPARKLES_GREEN : SPARKLES_CORAL;

  return (
    <div className="min-h-screen flex justify-center overflow-y-auto" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-[430px] flex flex-col" style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 12px)" }}>
        {/* Back */}
        <div className="px-6 pt-2">
          <button onClick={() => setUserType(null)} className="flex items-center gap-1.5 mb-1">
            <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--dark))" }} />
            <span className="text-[14px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>Change role</span>
          </button>
        </div>

        {/* ── Premium Illustration Hero ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="relative flex items-center justify-center pt-2 pb-1"
        >
          <div
            className="absolute rounded-full blur-[60px] opacity-30"
            style={{
              width: 200, height: 200,
              background: `radial-gradient(circle, ${accentColor}, transparent 70%)`,
              transform: "scale(1.3)",
            }}
          />
          <motion.img
            src={heroImg}
            alt=""
            className="relative w-[140px] h-[140px] object-contain drop-shadow-lg"
            animate={{ y: [0, -8, 0], rotate: [0, -1.5, 0, 1.5, 0] }}
            transition={{
              y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
            draggable={false}
          />
          {sparkles.map((s, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{ background: accentColor, top: s.top, left: s.left, opacity: 0.5 }}
              animate={{ y: [0, -12, 0], opacity: [0.3, 0.7, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: s.dur, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
            />
          ))}
        </motion.div>

        <div className="flex-1 px-6 pb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}>
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <img src={logo} alt="" className="w-7 h-7 rounded-lg object-contain" />
                <span className="text-[12px] font-sans font-medium tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>TendherMom</span>
              </div>
              <h1 className="font-serif text-[26px] leading-tight tracking-[-0.01em]" style={{ color: "hsl(var(--dark))" }}>
                {isMum ? "Create your account" : "Register as Expert"}
              </h1>
              <p className="text-[14px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                {isMum ? "Begin your pregnancy journey with us" : "Set up your professional profile"}
              </p>
            </div>

            {/* Role badge */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex justify-center mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: `hsla(var(${accentVar}), 0.1)`, boxShadow: "0 2px 12px -2px hsla(var(--dark), 0.06)" }}>
                <IonIcon name={isMum ? "heart" : "medkit"} size={14} style={{ color: accentColor }} />
                <span className="text-[11px] font-sans font-semibold" style={{ color: accentColor }}>
                  Registering as {isMum ? "Mum" : "Health Expert"}
                </span>
              </div>
            </motion.div>

            <form onSubmit={handleSignup} className="space-y-3.5">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <label className="text-[12px] font-sans font-semibold mb-1.5 block tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>Full Name</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><IonIcon name="person-outline" size={18} style={{ color: "hsl(var(--text-muted))" }} /></div>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={isMum ? "Amara Okafor" : "Dr. Ngozi Eze"} required maxLength={100}
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-[15px] font-sans outline-none transition-all focus:ring-2"
                    style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", boxShadow: "inset 0 1px 3px hsla(var(--dark), 0.04)", "--tw-ring-color": `hsla(var(${accentVar}), 0.3)` } as any} />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <label className="text-[12px] font-sans font-semibold mb-1.5 block tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><IonIcon name="mail-outline" size={18} style={{ color: "hsl(var(--text-muted))" }} /></div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required maxLength={255}
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-[15px] font-sans outline-none transition-all focus:ring-2"
                    style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", boxShadow: "inset 0 1px 3px hsla(var(--dark), 0.04)", "--tw-ring-color": `hsla(var(${accentVar}), 0.3)` } as any} />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <label className="text-[12px] font-sans font-semibold mb-1.5 block tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><IonIcon name="lock-closed-outline" size={18} style={{ color: "hsl(var(--text-muted))" }} /></div>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6}
                    className="w-full pl-10 pr-12 py-3.5 rounded-2xl text-[15px] font-sans outline-none transition-all focus:ring-2"
                    style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", boxShadow: "inset 0 1px 3px hsla(var(--dark), 0.04)", "--tw-ring-color": `hsla(var(${accentVar}), 0.3)` } as any} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5">
                    <IonIcon name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} style={{ color: "hsl(var(--text-muted))" }} />
                  </button>
                </div>
              </motion.div>

              <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
                className="w-full py-4 rounded-2xl text-[15px] font-semibold font-sans flex items-center justify-center gap-2 mt-1"
                style={{ background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 22%))", color: "white", opacity: loading ? 0.7 : 1, boxShadow: "0 6px 24px -6px hsla(153, 42%, 30%, 0.4)" }}>
                {loading ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <>Create Account <IonIcon name="arrow-forward" size={16} style={{ color: "white" }} /></>}
              </motion.button>
            </form>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 text-center">
              <p className="text-[14px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                Already have an account?{" "}<Link to="/login" className="font-semibold" style={{ color: "hsl(var(--green))" }}>Sign In</Link>
              </p>
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              className="mt-4 text-center text-[11px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
              By creating an account, you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import IonIcon from "@/components/IonIcon";
import InlineStatus, { type InlineStatusMsg } from "@/components/InlineStatus";
import { useAuthStore } from "@/stores/authStore";
import heroMumImg from "@/assets/auth-signup-hero.png";
import logo from "@/assets/logo.jpeg";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import LegalModal, { type LegalDoc } from "@/components/LegalModal";

const SPARKLES_GREEN = [
  { top: "12%", left: "-5%", delay: 0, dur: 2.4 },
  { top: "50%", left: "97%", delay: 0.5, dur: 2.8 },
  { top: "82%", left: "-3%", delay: 1, dur: 2.2 },
];

const Signup = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const PHONE_REGEX = /^\+234[0-9]{10}$/;
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
  const [formStatus, setFormStatus] = useState<InlineStatusMsg | null>(null);
  const [otpStatus, setOtpStatus] = useState<InlineStatusMsg | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  // Step 1: Send OTP code via Resend
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus(null);
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password || password.length < 6) {
      setFormStatus({ kind: "error", text: "Please fill all fields. Password must be at least 6 characters." });
      return;
    }
    if (!acceptTerms) {
      setFormStatus({ kind: "error", text: "Please accept our Terms of Service and Privacy Policy to continue." });
      return;
    }
    const cleanPhone = phone.replace(/\s/g, "");
    if (!PHONE_REGEX.test(cleanPhone)) {
      setFormStatus({ kind: "error", text: "Phone must be in format +234XXXXXXXXXX" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-verification-code", {
        body: { email: email.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setEmailSent(true);
      setOtpStatus({ kind: "success", text: "Verification code sent to your email!" });
    } catch (err: any) {
      setFormStatus({ kind: "error", text: err.message || "Failed to send verification code" });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP then create Supabase account
  const handleVerifyAndSignup = async () => {
    setOtpStatus(null);
    if (otpCode.length !== 6) {
      setOtpStatus({ kind: "error", text: "Please enter the 6-digit code" });
      return;
    }
    setVerifying(true);
    try {
      const { data: verifyData, error: verifyErr } = await supabase.functions.invoke("verify-email-code", {
        body: { email: email.trim(), code: otpCode },
      });
      if (verifyErr) throw verifyErr;
      if (verifyData?.error) throw new Error(verifyData.error);

      const { error: signupErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim(), phone: phone.replace(/\s/g, ""), user_type: "mother" },
        },
      });
      if (signupErr) throw signupErr;
      setOtpStatus({ kind: "success", text: "Account created — taking you in…" });
    } catch (err: any) {
      setOtpStatus({ kind: "error", text: err.message || "Verification failed" });
    } finally {
      setVerifying(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    setLoading(true);
    setOtpStatus(null);
    try {
      const { data, error } = await supabase.functions.invoke("send-verification-code", {
        body: { email: email.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOtpStatus({ kind: "success", text: "Verification code resent!" });
    } catch (err: any) {
      setOtpStatus({ kind: "error", text: err.message || "Failed to resend code" });
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP Code Entry Screen ───
  if (emailSent) {
    return (
      <div className="min-h-screen flex justify-center" style={{ background: "#FFFFFF" }}>
        <div className="w-full max-w-[430px] px-6 flex flex-col" style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 12px)" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex-1 flex flex-col pt-4">
            <button onClick={() => setEmailSent(false)} className="mb-6 self-start flex items-center gap-1.5">
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

            <InlineStatus status={otpStatus} />

            {/* OTP Input */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <label className="text-[12px] font-sans font-semibold tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>Verification Code</label>
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="w-12 h-14 text-xl font-semibold rounded-2xl border-0"
                      style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", boxShadow: "inset 0 1px 3px hsla(var(--dark), 0.04)" }}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleVerifyAndSignup}
                disabled={verifying || otpCode.length !== 6}
                className="w-full py-4 rounded-2xl text-[15px] font-semibold font-sans flex items-center justify-center gap-2 mt-2"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 22%))",
                  color: "white",
                  opacity: verifying || otpCode.length !== 6 ? 0.6 : 1,
                  boxShadow: "0 6px 24px -6px hsla(153, 42%, 30%, 0.4)",
                }}
              >
                {verifying ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : "Verify Email"}
              </motion.button>
            </div>

            <div className="mt-2 text-center">
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

  // ─── Registration Form ───
  const accentColor = "hsl(var(--green))";
  const accentVar = "--green";

  return (
    <div className="min-h-screen flex justify-center overflow-y-auto" style={{ background: "#FFFFFF" }}>
      <div className="w-full max-w-[430px] flex flex-col" style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 12px)" }}>
        {/* ── Premium Illustration Hero ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="relative flex items-center justify-center pt-6 pb-1"
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
            src={heroMumImg}
            alt=""
            className="relative w-[140px] h-[140px] object-contain drop-shadow-lg"
            animate={{ y: [0, -8, 0], rotate: [0, -1.5, 0, 1.5, 0] }}
            transition={{
              y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
            draggable={false}
          />
          {SPARKLES_GREEN.map((s, i) => (
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
                Create your account
              </h1>
              <p className="text-[14px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                Begin your pregnancy journey with us
              </p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-3.5">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <label className="text-[12px] font-sans font-semibold mb-1.5 block tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>Full Name</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><IonIcon name="person-outline" size={18} style={{ color: "hsl(var(--text-muted))" }} /></div>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Amara Okafor" required maxLength={100}
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

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
                <label className="text-[12px] font-sans font-semibold mb-1.5 block tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>Phone Number</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><IonIcon name="call-outline" size={18} style={{ color: "hsl(var(--text-muted))" }} /></div>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234XXXXXXXXXX" required maxLength={20} inputMode="tel"
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

              <InlineStatus status={formStatus} spacing="" />

              {/* Terms acceptance — must check to enable submit */}
              <motion.label
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="flex items-start gap-2.5 cursor-pointer select-none py-1"
              >
                <button
                  type="button"
                  onClick={() => setAcceptTerms(!acceptTerms)}
                  className="mt-[2px] w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    background: acceptTerms ? "hsl(var(--green))" : "hsl(var(--surface))",
                    border: acceptTerms ? "none" : "1.5px solid hsl(var(--border))",
                  }}
                  aria-checked={acceptTerms}
                  role="checkbox"
                >
                  {acceptTerms && <IonIcon name="checkmark" size={14} style={{ color: "white" }} />}
                </button>
                <span className="text-[12px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
                  I agree to TendherMom's{" "}
                  <button type="button" onClick={() => setLegalDoc("terms")} className="font-semibold underline" style={{ color: "hsl(var(--green))" }}>Terms of Service</button>
                  {" "}and{" "}
                  <button type="button" onClick={() => setLegalDoc("privacy")} className="font-semibold underline" style={{ color: "hsl(var(--green))" }}>Privacy Policy</button>.
                </span>
              </motion.label>

              <motion.button
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                whileTap={{ scale: 0.97 }} type="submit" disabled={loading || !acceptTerms}
                className="w-full py-4 rounded-2xl text-[15px] font-semibold font-sans flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 22%))", color: "white", opacity: (loading || !acceptTerms) ? 0.55 : 1, boxShadow: "0 6px 24px -6px hsla(153, 42%, 30%, 0.4)" }}
              >
                {loading ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <>Create Account <IonIcon name="arrow-forward" size={18} style={{ color: "white" }} /></>}
              </motion.button>
            </form>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 text-center">
              <p className="text-[14px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                Already have an account?{" "}
                <Link to="/login" className="font-semibold" style={{ color: "hsl(var(--green))" }}>Sign In</Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
};

export default Signup;

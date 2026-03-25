import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import IonIcon from "@/components/IonIcon";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex justify-center" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-[430px] px-6 flex flex-col" style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 12px)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="pt-4"
        >
          <Link to="/login" className="inline-flex items-center gap-1.5 mb-8">
            <IonIcon name="chevron-back" size={22} style={{ color: "hsl(var(--dark))" }} />
            <span className="text-[15px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>Back</span>
          </Link>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 250, damping: 25 }}
              className="text-center space-y-5 mt-8"
            >
              <div className="relative inline-block">
                <div
                  className="absolute inset-0 rounded-full blur-[30px]"
                  style={{ background: "hsla(var(--green), 0.15)", transform: "scale(2.5)" }}
                />
                <div
                  className="relative w-20 h-20 rounded-[24px] mx-auto flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsla(var(--green), 0.12), hsla(var(--green), 0.06))",
                    boxShadow: "0 8px 32px -8px hsla(var(--green), 0.15)",
                  }}
                >
                  <IonIcon name="mail-outline" size={36} style={{ color: "hsl(var(--green))" }} />
                </div>
              </div>
              <h1 className="font-serif text-[26px] tracking-[-0.01em]" style={{ color: "hsl(var(--dark))" }}>
                Check your email
              </h1>
              <p className="text-[14px] font-sans max-w-[280px] mx-auto" style={{ color: "hsl(var(--text-muted))" }}>
                We sent a password reset link to{" "}
                <strong style={{ color: "hsl(var(--dark))" }}>{email}</strong>
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 mt-2 text-[14px] font-semibold font-sans"
                style={{ color: "hsl(var(--green))" }}
              >
                <IonIcon name="arrow-back" size={16} style={{ color: "hsl(var(--green))" }} />
                Back to Sign In
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Icon */}
              <motion.div
                className="flex justify-center mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
              >
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full blur-[30px]"
                    style={{ background: "hsla(var(--coral), 0.12)", transform: "scale(2)" }}
                  />
                  <div
                    className="relative w-20 h-20 rounded-[24px] flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, hsla(var(--coral), 0.12), hsla(var(--coral), 0.06))",
                      boxShadow: "0 8px 32px -8px hsla(var(--coral), 0.12)",
                    }}
                  >
                    <IonIcon name="key-outline" size={36} style={{ color: "hsl(var(--coral))" }} />
                  </div>
                </div>
              </motion.div>

              <div className="text-center mb-8">
                <h1 className="font-serif text-[28px] tracking-[-0.01em]" style={{ color: "hsl(var(--dark))" }}>
                  Reset password
                </h1>
                <p className="text-[14px] font-sans mt-2 max-w-[260px] mx-auto" style={{ color: "hsl(var(--text-muted))" }}>
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-[12px] font-sans font-semibold mb-1.5 block tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                      <IonIcon name="mail-outline" size={18} style={{ color: "hsl(var(--text-muted))" }} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      required
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-[15px] font-sans outline-none transition-all focus:ring-2"
                      style={{
                        background: "hsl(var(--surface))",
                        color: "hsl(var(--dark))",
                        boxShadow: "inset 0 1px 3px hsla(var(--dark), 0.04)",
                        "--tw-ring-color": "hsla(var(--green), 0.3)",
                      } as any}
                    />
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl text-[15px] font-semibold font-sans flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 22%))",
                    color: "white",
                    opacity: loading ? 0.7 : 1,
                    boxShadow: "0 6px 24px -6px hsla(153, 42%, 30%, 0.4)",
                  }}
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </motion.button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;

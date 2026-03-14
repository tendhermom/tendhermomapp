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
      <div className="w-full max-w-[430px] px-6 pt-16 pb-8 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Link to="/login" className="inline-flex items-center gap-1 mb-8 ios-press">
            <IonIcon name="chevron-back" size={22} style={{ color: "hsl(var(--dark))" }} />
            <span className="text-[15px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>Back</span>
          </Link>

          {sent ? (
            <div className="text-center space-y-4 mt-12">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: "hsl(var(--light-green))" }}>
                <IonIcon name="mail-outline" size={32} style={{ color: "hsl(var(--green))" }} />
              </div>
              <h1 className="font-serif text-[28px]" style={{ color: "hsl(var(--dark))" }}>Check your email</h1>
              <p className="text-[15px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                We sent a password reset link to <strong style={{ color: "hsl(var(--dark))" }}>{email}</strong>
              </p>
              <Link to="/login" className="inline-block mt-4 text-[14px] font-semibold font-sans" style={{ color: "hsl(var(--green))" }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-[32px] mb-2" style={{ color: "hsl(var(--dark))" }}>
                Reset password
              </h1>
              <p className="text-[15px] font-sans mb-8" style={{ color: "hsl(var(--text-muted))" }}>
                Enter your email and we'll send you a reset link
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-[12px] font-sans font-semibold mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl text-[15px] font-sans outline-none"
                    style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", border: "1.5px solid hsl(var(--border))" }}
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-[15px] font-semibold font-sans ios-press"
                  style={{ background: "hsl(var(--green))", color: "white", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Sending…" : "Send Reset Link"}
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

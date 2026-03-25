import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import IonIcon from "@/components/IonIcon";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast.error("Invalid or expired reset link.");
      navigate("/login");
    }
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex justify-center" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-[430px] px-6 flex flex-col" style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 24px)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
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
                style={{ background: "hsla(var(--green), 0.15)", transform: "scale(2)" }}
              />
              <div
                className="relative w-20 h-20 rounded-[24px] flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, hsla(var(--green), 0.12), hsla(var(--green), 0.06))",
                  boxShadow: "0 8px 32px -8px hsla(var(--green), 0.15)",
                }}
              >
                <IonIcon name="shield-checkmark-outline" size={36} style={{ color: "hsl(var(--green))" }} />
              </div>
            </div>
          </motion.div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-[28px] tracking-[-0.01em]" style={{ color: "hsl(var(--dark))" }}>
              New password
            </h1>
            <p className="text-[14px] font-sans mt-2 max-w-[260px] mx-auto" style={{ color: "hsl(var(--text-muted))" }}>
              Choose a strong password for your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleReset} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="text-[12px] font-sans font-semibold mb-1.5 block tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>
                New Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <IonIcon name="lock-closed-outline" size={18} style={{ color: "hsl(var(--text-muted))" }} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3.5 rounded-2xl text-[15px] font-sans outline-none transition-all focus:ring-2"
                  style={{
                    background: "hsl(var(--surface))",
                    color: "hsl(var(--dark))",
                    boxShadow: "inset 0 1px 3px hsla(var(--dark), 0.04)",
                    "--tw-ring-color": "hsla(var(--green), 0.3)",
                  } as any}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5">
                  <IonIcon name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} style={{ color: "hsl(var(--text-muted))" }} />
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="text-[12px] font-sans font-semibold mb-1.5 block tracking-wide uppercase" style={{ color: "hsl(var(--text-muted))" }}>
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <IonIcon name="lock-open-outline" size={18} style={{ color: "hsl(var(--text-muted))" }} />
                </div>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  required
                  className="w-full pl-10 pr-12 py-3.5 rounded-2xl text-[15px] font-sans outline-none transition-all focus:ring-2"
                  style={{
                    background: "hsl(var(--surface))",
                    color: "hsl(var(--dark))",
                    boxShadow: "inset 0 1px 3px hsla(var(--dark), 0.04)",
                    "--tw-ring-color": "hsla(var(--green), 0.3)",
                  } as any}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5">
                  <IonIcon name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} style={{ color: "hsl(var(--text-muted))" }} />
                </button>
              </div>
            </motion.div>

            {/* Password match indicator */}
            {confirm.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 pl-1"
              >
                <IonIcon
                  name={password === confirm ? "checkmark-circle" : "close-circle"}
                  size={14}
                  style={{ color: password === confirm ? "hsl(var(--green))" : "hsl(var(--coral))" }}
                />
                <span className="text-[12px] font-sans" style={{ color: password === confirm ? "hsl(var(--green))" : "hsl(var(--coral))" }}>
                  {password === confirm ? "Passwords match" : "Passwords don't match"}
                </span>
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
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
                <>
                  Update Password
                  <IonIcon name="checkmark-circle-outline" size={16} style={{ color: "white" }} />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import IonIcon from "@/components/IonIcon";
import InlineStatus, { type InlineStatusMsg } from "@/components/InlineStatus";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<InlineStatusMsg | null>(null);

  const [linkState, setLinkState] = useState<"checking" | "ready" | "expired">("checking");

  useEffect(() => {
    let cancelled = false;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const finish = (state: "ready" | "expired") => { if (!cancelled) setLinkState(state); };

    (async () => {
      if (hash.get("error") || query.get("error")) return finish("expired");
      const code = query.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        return finish(error ? "expired" : "ready");
      }
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      if (access_token && refresh_token) {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) return finish("expired");
        }
        return finish("ready");
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) return finish("ready");
      navigate("/login", { replace: true });
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (password.length < 6) {
      setStatus({ kind: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (password !== confirm) {
      setStatus({ kind: "error", text: "Passwords don't match." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setStatus({ kind: "error", text: error.message });
    } else {
      setStatus({ kind: "success", text: "Password updated — taking you in…" });
      setTimeout(() => navigate("/"), 800);
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
                style={{ background: "hsla(153,42%,30%,0.15)", transform: "scale(2)" }}
              />
              <div
                className="relative w-20 h-20 rounded-[24px] flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, hsla(153,42%,30%,0.12), hsla(153,42%,30%,0.06))",
                  boxShadow: "0 8px 32px -8px hsla(153,42%,30%,0.15)",
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

          {linkState === "expired" ? (
            <div className="text-center space-y-4">
              <p className="text-[14px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                This reset link has expired or was already used. Request a new one and open it on this device.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => navigate("/forgot-password", { replace: true })}
                className="w-full py-4 rounded-2xl text-[15px] font-semibold font-sans"
                style={{ background: "hsl(var(--green))", color: "white" }}
              >
                Send a new link
              </motion.button>
            </div>
          ) : linkState === "checking" ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "hsla(153,42%,30%,0.2)", borderTopColor: "hsl(var(--green))" }} />
            </div>
          ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="text-[11px] font-sans font-semibold mb-2 block tracking-[0.14em] uppercase" style={{ color: "hsl(var(--text-muted))" }}>
                New Password
              </label>
              <div
                className="group relative rounded-2xl p-[1.5px] transition-all focus-within:shadow-[0_10px_30px_-12px_hsla(153,42%,30%,0.35)]"
                style={{ background: "hsla(153,42%,30%,0.16)" }}
              >
                <div className="relative rounded-[15px]" style={{ background: "#FFFFFF" }}>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsla(153,42%,30%,0.10), hsla(153,42%,30%,0.04))" }}>
                    <IonIcon name="lock-closed-outline" size={16} style={{ color: "hsl(var(--green))" }} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full pl-[52px] pr-12 py-[15px] rounded-[15px] text-[15px] font-sans font-medium bg-transparent outline-none tracking-[-0.005em]"
                    style={{ color: "hsl(var(--dark))" }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-[hsla(153,42%,30%,0.06)]">
                    <IonIcon name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} style={{ color: "hsl(var(--text-muted))" }} />
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="text-[11px] font-sans font-semibold mb-2 block tracking-[0.14em] uppercase" style={{ color: "hsl(var(--text-muted))" }}>
                Confirm Password
              </label>
              <div
                className="group relative rounded-2xl p-[1.5px] transition-all focus-within:shadow-[0_10px_30px_-12px_hsla(153,42%,30%,0.35)]"
                style={{ background: "hsla(153,42%,30%,0.16)" }}
              >
                <div className="relative rounded-[15px]" style={{ background: "#FFFFFF" }}>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsla(153,42%,30%,0.10), hsla(153,42%,30%,0.04))" }}>
                    <IonIcon name="lock-open-outline" size={16} style={{ color: "hsl(var(--green))" }} />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full pl-[52px] pr-12 py-[15px] rounded-[15px] text-[15px] font-sans font-medium bg-transparent outline-none tracking-[-0.005em]"
                    style={{ color: "hsl(var(--dark))" }}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-[hsla(153,42%,30%,0.06)]">
                    <IonIcon name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} style={{ color: "hsl(var(--text-muted))" }} />
                  </button>
                </div>
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

            <InlineStatus status={status} spacing="" />

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
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
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
              Start your pregnancy journey with TendherMom
            </p>
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

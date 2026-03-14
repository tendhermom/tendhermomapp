import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";

const ExpertPendingScreen = () => {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen flex justify-center" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-[430px] px-6 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{ background: "hsl(var(--light-green))" }}
        >
          <IonIcon name="hourglass-outline" size={36} style={{ color: "hsl(var(--green))" }} />
        </motion.div>

        <h1 className="font-serif text-[26px] mb-2" style={{ color: "hsl(var(--dark))" }}>
          Pending Approval
        </h1>
        <p className="text-[14px] font-sans leading-relaxed mb-8" style={{ color: "hsl(var(--text-muted))" }}>
          Your health expert account is being reviewed by our admin team. You'll be notified once it's approved.
        </p>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={logout}
          className="px-8 py-3 rounded-2xl text-[14px] font-sans font-medium"
          style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", border: "1px solid hsl(var(--border-subtle))" }}
        >
          Sign Out
        </motion.button>
      </div>
    </div>
  );
};

export default ExpertPendingScreen;

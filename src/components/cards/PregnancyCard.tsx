import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";

const PregnancyCard = () => {
  const currentWeek = useAuthStore((s) => s.getCurrentWeek());
  const daysLeft = useAuthStore((s) => s.getDaysRemaining());
  const totalWeeks = 40;
  const trimester = currentWeek <= 12 ? 1 : currentWeek <= 27 ? 2 : 3;
  const progress = (currentWeek / totalWeeks) * 100;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const fruitSize = currentWeek <= 12 ? "a lime" : currentWeek <= 20 ? "a banana" : currentWeek <= 28 ? "a mango" : "a watermelon";

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="hero-card p-5"
    >
      <div className="flex items-center gap-5 relative z-10">
        {/* Progress ring with mount animation */}
        <div className="relative w-[96px] h-[96px] flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="5"
            />
            <motion.circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="hsl(var(--coral))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
            />
          </svg>
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <span className="text-[28px] font-bold text-white leading-none font-sans">
              {currentWeek}
            </span>
            <span className="text-[11px] text-white/50 mt-0.5 font-sans">weeks</span>
          </motion.div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-1.5 relative z-10">
          <span
            className="label-caps px-2.5 py-[4px] rounded-full inline-block"
            style={{ background: "rgba(255,255,255,0.12)", color: "hsl(var(--coral))" }}
          >
            Trimester {trimester}
          </span>
          <h3 className="text-white text-[22px] font-serif">Week {currentWeek}</h3>
          <p className="text-white/60 text-[13px] font-sans">{daysLeft} days to go</p>
          <div className="flex items-center gap-2 pt-0.5">
            <IonIcon name="resize" size={16} style={{ color: "hsl(var(--coral))" }} />
            <p className="text-white/80 text-[13px] font-sans font-medium">Size of {fruitSize}</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mt-5 pt-4 relative z-10" style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}>
        {[
          { icon: "fitness-outline", label: "Kick Count" },
          { icon: "water-outline", label: "Hydration" },
          { icon: "moon-outline", label: "Sleep Log" },
        ].map((action, i) => (
          <motion.button
            key={action.label}
            whileTap={{ scale: 0.94 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.08 }}
            className="flex-1 flex items-center justify-center gap-1.5 py-[10px] rounded-2xl"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <IonIcon name={action.icon} size={15} style={{ color: "rgba(255,255,255,0.7)" }} />
            <span className="text-white/80 text-[11px] font-sans font-medium">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default PregnancyCard;

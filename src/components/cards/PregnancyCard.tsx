import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

const PregnancyCard = () => {
  const currentWeek = 24;
  const totalWeeks = 40;
  const daysLeft = 112;
  const trimester = 2;
  const progress = (currentWeek / totalWeeks) * 100;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="hero-card p-5"
    >
      <div className="flex items-center gap-5 relative z-10">
        {/* Progress ring */}
        <div className="relative w-[96px] h-[96px] flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="5"
            />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="hsl(var(--coral))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold text-white leading-none font-sans">
              {currentWeek}
            </span>
            <span className="text-[11px] text-white/50 mt-0.5 font-sans">weeks</span>
          </div>
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
            <p className="text-white/80 text-[13px] font-sans font-medium">Size of a mango</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mt-5 pt-4 relative z-10" style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}>
        {[
          { icon: "fitness-outline", label: "Kick Count" },
          { icon: "water-outline", label: "Hydration" },
          { icon: "moon-outline", label: "Sleep Log" },
        ].map((action) => (
          <motion.button
            key={action.label}
            whileTap={{ scale: 0.94 }}
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
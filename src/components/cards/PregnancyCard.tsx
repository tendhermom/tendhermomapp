import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";

const PregnancyCard = () => {
  const currentWeek = useAuthStore((s) => s.getCurrentWeek());
  const daysLeft = useAuthStore((s) => s.getDaysRemaining());
  const user = useAuthStore((s) => s.user);
  const totalWeeks = 40;
  const trimester = currentWeek <= 12 ? 1 : currentWeek <= 27 ? 2 : 3;
  const progress = (currentWeek / totalWeeks) * 100;
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const fruitSize =
    currentWeek <= 4 ? "a poppy seed" :
    currentWeek <= 8 ? "a raspberry" :
    currentWeek <= 12 ? "a lime" :
    currentWeek <= 16 ? "an avocado" :
    currentWeek <= 20 ? "a banana" :
    currentWeek <= 24 ? "a papaya" :
    currentWeek <= 28 ? "a mango" :
    currentWeek <= 32 ? "a coconut" :
    currentWeek <= 36 ? "a pineapple" :
    "a watermelon";

  const babyName = user?.baby_name || "Baby";

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-[22px]"
      style={{
        background: "linear-gradient(145deg, hsl(153 42% 22%), hsl(153 42% 30%), hsl(153 38% 26%))",
        boxShadow: "0 8px 32px -8px hsla(153,42%,20%,0.5), 0 2px 8px -2px hsla(0,0%,0%,0.12)",
      }}
    >
      {/* Decorative elements */}
      <div
        className="absolute -top-20 -right-20 w-[160px] h-[160px] rounded-full"
        style={{ background: "radial-gradient(circle, hsla(0,0%,100%,0.06) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-[120px] h-[120px] rounded-full"
        style={{ background: "radial-gradient(circle, hsla(0,0%,100%,0.04) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/2 right-8 w-[80px] h-[80px] rounded-full"
        style={{ background: "radial-gradient(circle, hsla(0,0%,100%,0.03) 0%, transparent 70%)" }}
      />

      <div className="p-5 relative z-10">
        <div className="flex items-center gap-5">
          {/* Progress ring */}
          <div className="relative w-[100px] h-[100px] flex-shrink-0">
            {/* Glow behind ring */}
            <div
              className="absolute inset-2 rounded-full"
              style={{ background: "radial-gradient(circle, hsla(11,74%,63%,0.15) 0%, transparent 70%)" }}
            />
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Track */}
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="4.5"
              />
              {/* Progress */}
              <motion.circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="hsl(var(--coral))"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
              />
              {/* Glow on progress end */}
              <motion.circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="hsla(11,74%,63%,0.3)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
                style={{ filter: "blur(4px)" }}
              />
            </svg>
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <span className="text-[30px] font-bold text-white leading-none font-sans">
                {currentWeek}
              </span>
              <span className="text-[10px] text-white/40 mt-0.5 font-sans tracking-wider uppercase">
                weeks
              </span>
            </motion.div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-1 relative z-10">
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] font-sans font-bold tracking-[1.5px] uppercase px-2.5 py-[3px] rounded-full inline-block"
              style={{ background: "rgba(255,255,255,0.1)", color: "hsl(var(--coral))" }}
            >
              Trimester {trimester}
            </motion.span>
            <motion.h3
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white text-[24px] font-serif leading-tight"
            >
              Week {currentWeek}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/50 text-[13px] font-sans"
            >
              {daysLeft} days to go
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-1.5 pt-0.5"
            >
              <IonIcon name="resize" size={14} style={{ color: "hsl(var(--coral))" }} />
              <p className="text-white/70 text-[12px] font-sans font-medium">
                {babyName} is the size of {fruitSize}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-2.5 mt-5 pt-4"
          style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          {[
            { icon: "fitness-outline", label: "Kick Count" },
            { icon: "water-outline", label: "Hydration" },
            { icon: "moon-outline", label: "Sleep Log" },
          ].map((action, i) => (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.92 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.06 }}
              className="flex-1 flex items-center justify-center gap-1.5 py-[10px] rounded-2xl transition-colors"
              style={{
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(8px)",
              }}
            >
              <IonIcon name={action.icon} size={14} style={{ color: "rgba(255,255,255,0.6)" }} />
              <span className="text-white/70 text-[11px] font-sans font-medium">{action.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PregnancyCard;

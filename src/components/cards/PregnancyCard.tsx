import { motion } from "framer-motion";

const PregnancyCard = () => {
  const currentWeek = 24;
  const totalWeeks = 40;
  const daysLeft = 84;
  const trimester = 2;
  const progress = (currentWeek / totalWeeks) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      whileTap={{ y: -2 }}
      className="bg-card rounded-xl card-shadow p-5"
    >
      <div className="flex items-center gap-5">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-foreground">
              {currentWeek}
            </span>
            <span className="text-[10px] text-muted-foreground">weeks</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Week {currentWeek}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Trimester {trimester}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {daysLeft} days to go
          </p>
          <p className="text-sm text-foreground">
            Your baby is the size of a 🥭
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PregnancyCard;

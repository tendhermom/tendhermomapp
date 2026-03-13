import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

const PregnancyCard = () => {
  const currentWeek = 24;
  const totalWeeks = 40;
  const daysLeft = 84;
  const trimester = 2;
  const progress = (currentWeek / totalWeeks) * 100;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="ios-card-elevated p-5 relative overflow-hidden"
    >
      {/* Subtle decorative gradient */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.04]"
        style={{ background: "hsl(var(--forest))", filter: "blur(40px)" }}
      />

      <div className="flex items-center gap-5 relative z-10">
        {/* Progress ring */}
        <div className="relative w-[100px] h-[100px] flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="hsl(var(--ios-separator))"
              strokeWidth="5"
            />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="hsl(var(--forest))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold text-foreground leading-none">
              {currentWeek}
            </span>
            <span className="ios-caption text-muted-foreground mt-0.5">weeks</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className="ios-caption font-semibold px-2 py-[3px] rounded-full"
              style={{
                background: "hsla(153, 42%, 30%, 0.08)",
                color: "hsl(var(--forest))",
              }}
            >
              Trimester {trimester}
            </span>
          </div>
          <h3 className="ios-title text-foreground">Week {currentWeek}</h3>
          <p className="ios-footnote text-muted-foreground">{daysLeft} days to go</p>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-lg">🥭</span>
            <p className="ios-footnote text-foreground font-medium">Size of a mango</p>
          </div>
        </div>
      </div>

      {/* Quick actions row */}
      <div className="flex gap-2 mt-4 pt-4 relative z-10" style={{ borderTop: "0.5px solid hsl(var(--ios-separator))" }}>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl ios-press"
          style={{ background: "hsla(153, 42%, 30%, 0.06)" }}
        >
          <IonIcon name="fitness-outline" size={16} style={{ color: "hsl(var(--forest))" }} />
          <span className="ios-caption font-medium" style={{ color: "hsl(var(--forest))" }}>Kick Count</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl ios-press"
          style={{ background: "hsla(153, 42%, 30%, 0.06)" }}
        >
          <IonIcon name="water-outline" size={16} style={{ color: "hsl(var(--forest))" }} />
          <span className="ios-caption font-medium" style={{ color: "hsl(var(--forest))" }}>Hydration</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl ios-press"
          style={{ background: "hsla(153, 42%, 30%, 0.06)" }}
        >
          <IonIcon name="moon-outline" size={16} style={{ color: "hsl(var(--forest))" }} />
          <span className="ios-caption font-medium" style={{ color: "hsl(var(--forest))" }}>Sleep</span>
        </button>
      </div>
    </motion.div>
  );
};

export default PregnancyCard;

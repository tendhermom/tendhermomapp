import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface ReminderCardProps {
  icon: string;
  title: string;
  subtitle: string;
  time: string;
  type: "medication" | "appointment" | "hydration";
  done?: boolean;
  onToggle?: () => void;
}

const typeStyles = {
  medication: { bg: "hsl(var(--light-coral))", color: "hsl(var(--coral))" },
  appointment: { bg: "hsl(var(--light-green))", color: "hsl(var(--green))" },
  hydration: { bg: "hsl(214 80% 94%)", color: "hsl(214 60% 50%)" },
};

const ReminderCard = ({ icon, title, subtitle, time, type, done, onToggle }: ReminderCardProps) => {
  const style = typeStyles[type];

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
      className="tend-card flex items-center gap-3.5 p-4 cursor-pointer"
      style={{ opacity: done ? 0.5 : 1 }}
    >
      <div
        className="w-[44px] h-[44px] rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: style.bg }}
      >
        <IonIcon name={icon} size={22} style={{ color: style.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <h4
          className="text-[14px] font-semibold font-sans leading-tight"
          style={{
            color: "hsl(var(--dark))",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {title}
        </h4>
        <p className="text-[12px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
          {subtitle}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-[12px] font-semibold font-sans" style={{ color: "hsl(var(--text-muted))" }}>
          {time}
        </span>
        <div
          className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center"
          style={{
            borderColor: done ? style.color : "hsl(var(--border-subtle))",
            background: done ? style.color : "transparent",
          }}
        >
          {done && <IonIcon name="checkmark" size={12} style={{ color: "white" }} />}
        </div>
      </div>
    </motion.div>
  );
};

export default ReminderCard;

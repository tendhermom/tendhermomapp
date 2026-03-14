import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface BabyShowerCardProps {
  name: string;
  parentName: string;
  date: string;
  imageUrl: string;
  gender: "boy" | "girl";
}

const BabyShowerCard = ({ name, parentName, date, imageUrl, gender }: BabyShowerCardProps) => {
  const accentColor = gender === "boy" ? "hsl(214 60% 55%)" : "hsl(var(--coral))";
  const accentBg = gender === "boy" ? "hsl(214 80% 94%)" : "hsl(var(--light-coral))";

  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      className="tend-card overflow-hidden flex-shrink-0 cursor-pointer"
      style={{ width: 200 }}
    >
      <div
        className="w-full h-[140px] flex items-center justify-center relative"
        style={{ background: accentBg }}
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div
          className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full"
          style={{ background: accentColor }}
        >
          <span className="text-[10px] font-bold text-white font-sans uppercase tracking-wider">
            {gender === "boy" ? "👶 Boy" : "👶 Girl"}
          </span>
        </div>
      </div>
      <div className="p-3.5 space-y-1">
        <h4 className="text-[14px] font-semibold font-sans leading-tight" style={{ color: "hsl(var(--dark))" }}>
          Baby {name}
        </h4>
        <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
          {parentName}
        </p>
        <div className="flex items-center gap-1 pt-0.5">
          <IonIcon name="calendar-outline" size={12} style={{ color: "hsl(var(--text-muted))" }} />
          <span className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
            {date}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default BabyShowerCard;

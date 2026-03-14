import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface BabyShowerCardProps {
  name: string;
  parentName: string;
  date: string;
  imageUrl: string;
  gender: "boy" | "girl";
  reactionsCount?: number;
  userReaction?: string | null;
  onReaction?: (type: "congrats" | "love" | "celebrate") => void;
  onCongrats?: () => void;
}

const REACTION_OPTIONS: { type: "congrats" | "love" | "celebrate"; icon: string; label: string }[] = [
  { type: "congrats", icon: "heart", label: "Congrats" },
  { type: "love", icon: "heart-circle", label: "Love" },
  { type: "celebrate", icon: "sparkles", label: "Celebrate" },
];

const BabyShowerCard = ({
  name,
  parentName,
  imageUrl,
  gender,
  reactionsCount = 0,
  userReaction,
  onReaction,
  onCongrats,
}: BabyShowerCardProps) => {
  const [showReactions, setShowReactions] = useState(false);
  const accentColor = gender === "boy" ? "hsl(214 60% 55%)" : "hsl(var(--coral))";
  const accentBg = gender === "boy" ? "hsl(214 80% 94%)" : "hsl(var(--light-coral))";

  const handleMainAction = () => {
    if (onCongrats) {
      onCongrats();
    } else if (onReaction) {
      setShowReactions(!showReactions);
    }
  };

  const handleReactionSelect = (type: "congrats" | "love" | "celebrate") => {
    onReaction?.(type);
    setShowReactions(false);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      className="overflow-hidden flex-shrink-0 rounded-2xl relative"
      style={{
        width: "100%",
        minWidth: 160,
        maxWidth: 200,
        background: "hsl(var(--surface))",
        boxShadow: "0 2px 16px -4px hsla(0,0%,0%,0.08)",
      }}
    >
      <div className="w-full h-[130px] relative" style={{ background: accentBg }}>
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full" style={{ background: accentColor }}>
          <span className="text-[10px] font-bold text-white font-sans uppercase tracking-wider">
            {gender === "boy" ? "Boy" : "Girl"}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div>
          <h4 className="text-[14px] font-semibold font-sans leading-tight" style={{ color: "hsl(var(--dark))" }}>
            Baby {name}
          </h4>
          <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
            {parentName}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleMainAction}
            className="flex-1 py-1.5 rounded-xl text-[12px] font-semibold font-sans flex items-center justify-center gap-1 ios-press"
            style={{
              background: userReaction ? "hsl(var(--light-coral))" : "hsl(var(--light-green))",
              color: userReaction ? "hsl(var(--coral))" : "hsl(var(--green))",
            }}
          >
            <IonIcon
              name={userReaction ? "heart" : "heart-outline"}
              size={14}
              style={{ color: userReaction ? "hsl(var(--coral))" : "hsl(var(--green))" }}
            />
            {userReaction ? "Reacted" : "Congrats"}
          </motion.button>
          {reactionsCount > 0 && (
            <span className="text-[11px] font-sans font-medium ml-1.5" style={{ color: "hsl(var(--text-muted))" }}>
              {reactionsCount}
            </span>
          )}
        </div>
      </div>

      {/* Reaction picker popup */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            className="absolute bottom-[52px] left-2 right-2 z-10 rounded-2xl p-2 flex items-center justify-around"
            style={{ background: "hsl(var(--surface))", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
          >
            {REACTION_OPTIONS.map((r) => (
              <motion.button
                key={r.type}
                whileTap={{ scale: 0.85 }}
                onClick={() => handleReactionSelect(r.type)}
                className="flex flex-col items-center gap-0.5 px-2 py-1"
              >
                <IonIcon name={r.icon} size={20} style={{ color: "hsl(var(--coral))" }} />
                <span className="text-[9px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>
                  {r.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BabyShowerCard;

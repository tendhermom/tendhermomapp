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
  onReaction?: (type: "congrats" | "love" | "like" | "celebrate") => void;
  giftEnabled?: boolean;
  giftTotal?: number;
  isPremium?: boolean;
  isOwner?: boolean;
  onToggleGift?: () => void;
  onSendGift?: () => void;
  onViewGifts?: () => void;
}

const REACTIONS: { type: "congrats" | "love" | "like" | "celebrate"; icon: string; activeIcon: string; label: string; color: string }[] = [
  { type: "congrats", icon: "ribbon-outline", activeIcon: "ribbon", label: "Congrats", color: "hsl(var(--coral))" },
  { type: "love", icon: "heart-outline", activeIcon: "heart", label: "Love", color: "hsl(340 75% 55%)" },
  { type: "like", icon: "thumbs-up-outline", activeIcon: "thumbs-up", label: "Like", color: "hsl(var(--green))" },
  { type: "celebrate", icon: "sparkles-outline", activeIcon: "sparkles", label: "Celebrate", color: "hsl(45 90% 50%)" },
];

const BabyShowerCard = ({
  name,
  parentName,
  imageUrl,
  gender,
  reactionsCount = 0,
  userReaction,
  onReaction,
  giftEnabled = false,
  giftTotal = 0,
  isPremium = false,
  isOwner = false,
  onToggleGift,
  onSendGift,
  onViewGifts,
}: BabyShowerCardProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const accentColor = gender === "boy" ? "hsl(214 60% 55%)" : "hsl(var(--coral))";
  const accentBg = gender === "boy" ? "hsl(214 80% 94%)" : "hsl(var(--light-coral))";

  const activeReaction = REACTIONS.find((r) => r.type === userReaction);

  const handleTap = () => {
    if (userReaction) {
      onReaction?.(userReaction as any);
    } else {
      setShowPicker(true);
    }
  };

  const handleSelect = (type: "congrats" | "love" | "like" | "celebrate") => {
    onReaction?.(type);
    setShowPicker(false);
  };

  return (
    <motion.div
      className="overflow-hidden flex-shrink-0 rounded-2xl relative"
      style={{
        width: "100%",
        minWidth: 160,
        maxWidth: 200,
        background: "hsl(var(--surface))",
        boxShadow: "0 2px 16px -4px hsla(0,0%,0%,0.08)",
      }}
    >
      {/* Image */}
      <div className="w-full h-[130px] relative" style={{ background: accentBg }}>
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full" style={{ background: accentColor }}>
          <span className="text-[10px] font-bold text-white font-sans uppercase tracking-wider">
            {gender === "boy" ? "Boy" : "Girl"}
          </span>
        </div>
        {/* Gift badge */}
        {giftEnabled && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "hsl(45 90% 50%)" }}>
            <IonIcon name="gift" size={10} style={{ color: "white" }} />
            <span className="text-[9px] font-bold text-white font-sans">GIFTS</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <h4 className="text-[14px] font-semibold font-sans leading-tight" style={{ color: "hsl(var(--dark))" }}>
            Baby {name}
          </h4>
          <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
            {parentName}
          </p>
        </div>

        {/* Gift section */}
        {giftEnabled && (
          <div className="flex items-center gap-1.5">
            {isOwner ? (
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={onViewGifts}
                className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold font-sans flex items-center justify-center gap-1"
                style={{ background: "hsl(45 93% 92%)", color: "hsl(45 90% 40%)" }}
              >
                <IonIcon name="gift" size={12} style={{ color: "hsl(45 90% 40%)" }} />
                ₦{giftTotal.toLocaleString()}
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={onSendGift}
                className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold font-sans flex items-center justify-center gap-1"
                style={{ background: "hsl(45 93% 92%)", color: "hsl(45 90% 40%)" }}
              >
                <IonIcon name="gift-outline" size={12} style={{ color: "hsl(45 90% 40%)" }} />
                Send Gift
              </motion.button>
            )}
          </div>
        )}

        {/* Owner toggle gift */}
        {isOwner && isPremium && !giftEnabled && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onToggleGift}
            className="w-full py-1.5 rounded-xl text-[10px] font-semibold font-sans flex items-center justify-center gap-1"
            style={{ background: "hsl(var(--bg))", color: "hsl(var(--text-muted))", border: "1px dashed hsl(var(--border-subtle))" }}
          >
            <IonIcon name="gift-outline" size={11} style={{ color: "hsl(var(--text-muted))" }} />
            Enable Gifts
          </motion.button>
        )}

        {/* Reaction button */}
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleTap}
            className="flex-1 py-1.5 rounded-xl text-[12px] font-semibold font-sans flex items-center justify-center gap-1"
            style={{
              background: activeReaction ? accentBg : "hsl(var(--bg))",
              color: activeReaction ? activeReaction.color : "hsl(var(--text-muted))",
            }}
          >
            <IonIcon
              name={activeReaction ? activeReaction.activeIcon : "heart-outline"}
              size={14}
              style={{ color: activeReaction ? activeReaction.color : "hsl(var(--text-muted))" }}
            />
            {activeReaction ? activeReaction.label : "React"}
          </motion.button>
          {reactionsCount > 0 && (
            <span className="text-[11px] font-sans font-medium ml-1.5" style={{ color: "hsl(var(--text-muted))" }}>
              {reactionsCount}
            </span>
          )}
        </div>
      </div>

      {/* Reaction picker */}
      <AnimatePresence>
        {showPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[50]"
              onClick={() => setShowPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute bottom-[52px] left-1 right-1 z-[51] rounded-2xl p-1.5 flex items-center justify-around"
              style={{ background: "hsl(var(--surface))", boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
            >
              {REACTIONS.map((r) => (
                <motion.button
                  key={r.type}
                  whileTap={{ scale: 0.8 }}
                  whileHover={{ scale: 1.15 }}
                  onClick={() => handleSelect(r.type)}
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl"
                >
                  <IonIcon name={r.activeIcon} size={20} style={{ color: r.color }} />
                  <span className="text-[8px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                    {r.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BabyShowerCard;

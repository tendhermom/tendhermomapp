import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";

export type BirthType = "single" | "twins" | "triplets" | "quadruplets";

interface BabyShowerCardProps {
  name: string;
  parentName: string;
  date: string;
  imageUrl: string;
  gender: "boy" | "girl" | "mixed";
  birthType?: BirthType;
  reactionsCount?: number;
  userReaction?: string | null;
  onReaction?: (type: "congrats" | "love" | "gifted") => void;
  // Peer-to-peer "Give a Gift"
  isOwner?: boolean;
  onGiveGift?: () => void;
}

type ReactionMeta = { type: string; icon: string; activeIcon: string; label: string; color: string };

const BASE_REACTIONS: ReactionMeta[] = [
  { type: "congrats", icon: "ribbon-outline", activeIcon: "ribbon", label: "Congrats", color: "hsl(var(--coral))" },
  { type: "love", icon: "heart-outline", activeIcon: "heart", label: "Love", color: "hsl(340 75% 55%)" },
];

const GIFT_REACTION: ReactionMeta = { type: "gift", icon: "gift-outline", activeIcon: "gift", label: "Gift", color: "hsl(45 90% 40%)" };
const GIFTED_META: ReactionMeta = { type: "gifted", icon: "gift", activeIcon: "gift", label: "Gifted", color: "hsl(45 90% 40%)" };

const BIRTH_TYPE_LABEL: Record<BirthType, string> = {
  single: "",
  twins: "Twins",
  triplets: "Triplets",
  quadruplets: "Quads",
};

const BabyShowerCard = ({
  name,
  parentName,
  imageUrl,
  gender,
  birthType = "single",
  reactionsCount = 0,
  userReaction,
  onReaction,
  isOwner = false,
  onGiveGift,
}: BabyShowerCardProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const accentColor =
    gender === "boy"
      ? "hsl(214 60% 55%)"
      : gender === "girl"
      ? "hsl(var(--coral))"
      : "hsl(var(--green))";
  const accentBg =
    gender === "boy"
      ? "hsl(214 80% 94%)"
      : gender === "girl"
      ? "hsl(var(--light-coral))"
      : "hsl(var(--light-green))";
  const genderLabel = gender === "boy" ? "Boy" : gender === "girl" ? "Girl" : "Mixed";

  // Determine active reaction (including "gifted" pseudo-state)
  const activeReaction: ReactionMeta | undefined =
    userReaction === "gifted"
      ? GIFTED_META
      : BASE_REACTIONS.find((r) => r.type === userReaction);

  // Gift is always available to visitors — availability of account details is
  // resolved when they tap Gift (fetched from the poster's Gift Settings).
  const pickerReactions: ReactionMeta[] = !isOwner
    ? [...BASE_REACTIONS, GIFT_REACTION]
    : BASE_REACTIONS;

  const handleTap = () => {
    if (userReaction === "gifted") {
      // Tapping the "Gifted" chip re-opens the bank details sheet (no toggle-off)
      onGiveGift?.();
      return;
    }
    if (userReaction) {
      onReaction?.(userReaction as any);
    } else {
      setShowPicker(true);
    }
  };

  const handleSelect = (type: string) => {
    setShowPicker(false);
    if (type === "gift") {
      onGiveGift?.();
      return;
    }
    onReaction?.(type as any);
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
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const t = e.currentTarget;
            if (t.src.indexOf("unsplash.com") === -1) {
              t.src = "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop";
            }
          }}
        />
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full" style={{ background: accentColor }}>
          <span className="text-[10px] font-bold text-white font-sans uppercase tracking-wider">
            {genderLabel}
          </span>
        </div>
        {/* Multiple-birth badge */}
        {birthType !== "single" && (
          <div
            className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: "hsl(var(--green))" }}
          >
            <IonIcon name="people" size={10} style={{ color: "white" }} />
            <span className="text-[9px] font-bold text-white font-sans uppercase tracking-wider">
              {BIRTH_TYPE_LABEL[birthType]}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <h4 className="text-[14px] font-semibold font-sans leading-tight" style={{ color: "hsl(var(--dark))" }}>
            {birthType === "single" ? `Baby ${name}` : name}
          </h4>
          <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
            {parentName}
          </p>
        </div>

        {/* "Give a Gift" is integrated into the reaction picker as a "Gift" option (visitors only). */}



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
              {pickerReactions.map((r) => (
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

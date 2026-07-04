import { useEffect } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";
import { usePointsStore } from "@/stores/pointsStore";
import levelsHero from "@/assets/heroes/levels-hero.jpg.asset.json";

interface GamificationScreenProps {
  onBack: () => void;
}

const LEVELS = [
  { name: "Newbie Nest", min: 0, color: "hsl(340 82% 72%)", bg: "hsl(340 82% 95%)", badge: "🌸", tagline: "Welcome to the family!" },
  { name: "Baby Steps", min: 100, color: "hsl(45 93% 50%)", bg: "hsl(45 93% 92%)", badge: "🌻", tagline: "You're getting the hang of it!" },
  { name: "Mommy Mode", min: 500, color: "hsl(153 42% 30%)", bg: "hsl(144 28% 93%)", badge: "💚", tagline: "You're crushing it, mama!" },
  { name: "Super Mom", min: 2000, color: "hsl(210 80% 55%)", bg: "hsl(210 80% 93%)", badge: "💙", tagline: "You've got super powers!" },
  { name: "Mommy Master", min: 5000, color: "hsl(270 60% 55%)", bg: "hsl(270 60% 93%)", badge: "💜", tagline: "You're a pro, queen!" },
  { name: "Legendary Mom", min: 10000, color: "hsl(30 90% 50%)", bg: "hsl(30 90% 92%)", badge: "👑", tagline: "You're an absolute legend!" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const GamificationScreen = ({ onBack }: GamificationScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const { userPoints, fetchPoints } = usePointsStore();

  useEffect(() => {
    if (user?.id) fetchPoints(user.id);
  }, [user?.id]);

  const points = userPoints?.points || 0;
  let currentLevelIdx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].min) currentLevelIdx = i;
  }
  const currentLevel = LEVELS[currentLevelIdx];
  const nextLevel = LEVELS[currentLevelIdx + 1];
  const progressToNext = nextLevel
    ? ((points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;

  return (
    <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
      {/* Image-backed Hero — Rescue Map / Antenatal style */}
      <motion.div
        variants={fadeUp}
        className="relative rounded-[20px] overflow-hidden"
        style={{ marginTop: 4 }}
      >
        <img
          src={levelsHero.url}
          alt="Levels & Rewards"
          className="w-full h-[220px] object-cover"
          width={1280}
          height={768}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, hsla(153,42%,15%,0.88) 0%, hsla(153,42%,20%,0.5) 55%, hsla(0,0%,0%,0.15) 100%)",
          }}
        />

        {/* Back chip */}
        <div className="absolute top-3 left-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="flex items-center gap-0.5 ios-press px-2 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
          >
            <IonIcon name="chevron-back" size={18} style={{ color: "white" }} />
            <span className="text-[13px] font-sans font-medium text-white">Back</span>
          </motion.button>
        </div>

        {/* Level badge chip top-right */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)" }}
        >
          <span className="text-[14px] leading-none">{currentLevel.badge}</span>
          <span className="text-white text-[11px] font-sans font-semibold tracking-wide uppercase">
            Level {currentLevelIdx + 1}
          </span>
        </div>

        {/* Bottom title block */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-serif text-[26px] text-white leading-tight truncate">
                {currentLevel.name}
              </h1>
              <p className="text-white/70 text-[12px] font-sans mt-1">{currentLevel.tagline}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-serif text-[26px] leading-none" style={{ color: "hsl(var(--coral))" }}>
                {points}
              </p>
              <p className="text-white/60 text-[10px] font-sans uppercase tracking-wider mt-0.5">points</p>
            </div>
          </div>

          {nextLevel && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-sans font-semibold uppercase tracking-wider text-white/60">
                  To {nextLevel.name}
                </span>
                <span className="text-[9px] font-sans font-semibold text-white/60">
                  {nextLevel.min - points} pts to go
                </span>
              </div>
              <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.18)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(45 93% 58%), hsl(var(--coral)))" }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Header row (below hero) */}
      <motion.div variants={fadeUp} className="flex items-center gap-3 -mt-1">
        <h2 className="text-[20px] font-serif" style={{ color: "hsl(var(--dark))" }}>Levels & Rewards</h2>
      </motion.div>

      {/* How to Earn */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-2">HOW TO EARN POINTS</p>
        <div className="tend-card overflow-hidden">
          {[
            { icon: "create-outline", label: "Create a post", pts: "+10", color: "green" },
            { icon: "heart-outline", label: "Like a post", pts: "+2", color: "coral" },
            { icon: "chatbubble-outline", label: "Comment on a post", pts: "+5", color: "green" },
            { icon: "people-outline", label: "Refer a friend", pts: "+25", color: "coral" },
            { icon: "star-outline", label: "Refer Plus user", pts: "+50", color: "green" },
          ].map((item, i, arr) => (
            <div key={item.label} className="flex items-center px-4 py-3 gap-3" style={{ borderBottom: i < arr.length - 1 ? "1px solid hsl(var(--border-subtle))" : "none" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: item.color === "green" ? "hsl(var(--light-green))" : "hsl(var(--light-coral))" }}>
                <IonIcon name={item.icon} size={16} style={{ color: item.color === "green" ? "hsl(var(--green))" : "hsl(var(--coral))" }} />
              </div>
              <span className="flex-1 text-[13px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>{item.label}</span>
              <span className="text-[12px] font-sans font-bold" style={{ color: "hsl(var(--green))" }}>{item.pts}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* All Levels */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-2">ALL LEVELS</p>
        <div className="space-y-2">
          {LEVELS.map((level, i) => {
            const isUnlocked = points >= level.min;
            const isCurrent = i === currentLevelIdx;
            return (
              <div
                key={level.name}
                className="tend-card p-4 flex items-center gap-3"
                style={{
                  opacity: isUnlocked ? 1 : 0.5,
                  border: isCurrent ? `2px solid ${level.color}` : "2px solid transparent",
                }}
              >
                <div className="text-[28px]">{level.badge}</div>
                <div className="flex-1">
                  <p className="text-[14px] font-sans font-semibold" style={{ color: isUnlocked ? level.color : "hsl(var(--text-muted))" }}>
                    {level.name}
                  </p>
                  <p className="text-[10px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>{level.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-sans font-semibold" style={{ color: "hsl(var(--text-muted))" }}>{level.min} pts</p>
                  {isUnlocked && (
                    <IonIcon name="checkmark-circle" size={16} style={{ color: level.color }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-2">YOUR STATS</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="tend-card p-3 text-center">
            <p className="text-[20px] font-serif" style={{ color: "hsl(var(--green))" }}>{userPoints?.posts_count || 0}</p>
            <p className="text-[9px] font-sans font-semibold uppercase tracking-wider mt-1" style={{ color: "hsl(var(--text-muted))" }}>Posts</p>
          </div>
          <div className="tend-card p-3 text-center">
            <p className="text-[20px] font-serif" style={{ color: "hsl(var(--coral))" }}>{userPoints?.likes_count || 0}</p>
            <p className="text-[9px] font-sans font-semibold uppercase tracking-wider mt-1" style={{ color: "hsl(var(--text-muted))" }}>Likes</p>
          </div>
          <div className="tend-card p-3 text-center">
            <p className="text-[20px] font-serif" style={{ color: "hsl(var(--green))" }}>{userPoints?.comments_count || 0}</p>
            <p className="text-[9px] font-sans font-semibold uppercase tracking-wider mt-1" style={{ color: "hsl(var(--text-muted))" }}>Comments</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GamificationScreen;

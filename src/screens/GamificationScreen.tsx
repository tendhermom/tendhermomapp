import { useEffect } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";
import { usePointsStore } from "@/stores/pointsStore";

interface GamificationScreenProps {
  onBack: () => void;
}

const LEVELS = [
  { name: "Newbie Nest", min: 0, color: "hsl(340 82% 72%)", bg: "hsl(340 82% 95%)", badge: "🌸", tagline: "Welcome to the family!" },
  { name: "Baby Steps", min: 100, color: "hsl(45 93% 50%)", bg: "hsl(45 93% 92%)", badge: "🌻", tagline: "You're getting the hang of it!" },
  { name: "Mommy Mode", min: 500, color: "hsl(153 42% 30%)", bg: "hsl(144 28% 93%)", badge: "💚", tagline: "You're crushing it, mama!" },
  { name: "Super Mom", min: 2000, color: "hsl(210 80% 55%)", bg: "hsl(210 80% 93%)", badge: "💙", tagline: "You've got super powers!" },
  { name: "Mommy Master", min: 5000, color: "hsl(270 60% 55%)", bg: "hsl(270 60% 93%)", badge: "💜", tagline: "You're a pro, queen!" },
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
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <button onClick={onBack} className="ios-press">
          <IonIcon name="arrow-back" size={22} style={{ color: "hsl(var(--dark))" }} />
        </button>
        <h1 className="text-[24px] font-serif" style={{ color: "hsl(var(--dark))" }}>Levels & Rewards</h1>
      </motion.div>

      {/* Current Level Hero */}
      <motion.div variants={fadeUp} className="hero-card p-5 text-center">
        <div className="text-[48px] mb-2">{currentLevel.badge}</div>
        <h2 className="text-white text-[22px] font-serif">{currentLevel.name}</h2>
        <p className="text-white/60 text-[12px] font-sans mt-1">{currentLevel.tagline}</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-[28px] font-serif" style={{ color: "hsl(var(--coral))" }}>{points}</span>
          <span className="text-white/50 text-[12px] font-sans">points</span>
        </div>
        {nextLevel && (
          <div className="mt-4 px-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-sans font-semibold uppercase tracking-wider text-white/40">Progress to {nextLevel.name}</span>
              <span className="text-[9px] font-sans font-semibold text-white/40">{nextLevel.min - points} pts to go</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "hsl(var(--coral))" }}
              />
            </div>
          </div>
        )}
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
            { icon: "star-outline", label: "Refer premium user", pts: "+50", color: "green" },
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

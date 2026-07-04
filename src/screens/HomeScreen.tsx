import { useState, useEffect } from "react";
import TopBar from "@/components/navigation/TopBar";
import { useAuthStore } from "@/stores/authStore";
import { usePointsStore } from "@/stores/pointsStore";
import IonIcon from "@/components/IonIcon";
import { motion } from "framer-motion";

interface HomeScreenProps {
  onNavigate: (tab: string) => void;
}

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
};

const GAMIFICATION_LEVELS = [
  { name: "Newbie Nest", min: 0, color: "hsl(340 82% 72%)", badge: "🌸" },
  { name: "Baby Steps", min: 100, color: "hsl(45 93% 58%)", badge: "🌻" },
  { name: "Mommy Mode", min: 500, color: "hsl(153 42% 30%)", badge: "💚" },
  { name: "Super Mom", min: 2000, color: "hsl(210 80% 55%)", badge: "💙" },
  { name: "Mommy Master", min: 5000, color: "hsl(270 60% 55%)", badge: "💜" },
  { name: "Legendary Mom", min: 10000, color: "hsl(30 90% 50%)", badge: "👑" },
];

const getGamificationLevel = (points: number) => {
  let level = GAMIFICATION_LEVELS[0];
  for (const l of GAMIFICATION_LEVELS) {
    if (points >= l.min) level = l;
  }
  return level;
};

const QUICK_ACTIONS = [
  { id: "antenatal", label: "Antenatal", icon: "medkit-outline", color: "hsl(var(--green))", bg: "hsl(var(--light-green))" },
  { id: "health-hubs", label: "Rescue Map", icon: "location-outline", color: "hsl(var(--coral))", bg: "hsl(var(--light-coral))" },
  { id: "health-tracker", label: "Health Tracker", icon: "heart-outline", color: "hsl(var(--green))", bg: "hsl(var(--light-green))" },
  { id: "insights", label: "Insights", icon: "bulb-outline", color: "hsl(var(--coral))", bg: "hsl(var(--light-coral))" },
];

const WEEKLY_HIGHLIGHTS = [
  { id: "health-hubs", label: "Rescue Map", desc: "Find nearby health centers", icon: "location-outline", color: "green" },
  { id: "baby-shower", label: "Baby Shower", desc: "Share & celebrate milestones", icon: "gift-outline", color: "coral" },
  { id: "gamification", label: "Your Level", desc: "Earn points & climb ranks", icon: "trophy-outline", color: "green" },
];

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const currentWeek = useAuthStore((s) => s.getCurrentWeek());
  const daysLeft = useAuthStore((s) => s.getDaysRemaining());
  const progressPercent = useAuthStore((s) => s.getProgressPercent());
  const { userPoints, fetchPoints } = usePointsStore();

  useEffect(() => {
    if (user?.id) fetchPoints(user.id);
  }, [user?.id]);

  const displayName = user?.full_name?.split(" ")[0] || "there";
  const greeting = getGreeting();
  const trimester = currentWeek <= 13 ? "1st Trimester" : currentWeek <= 26 ? "2nd Trimester" : currentWeek <= 40 ? "3rd Trimester" : "Postpartum";
  const hasDueDate = !!user?.due_date;
  const points = userPoints?.points || 0;
  const level = getGamificationLevel(points);

  // Baby size by week
  const BABY_SIZES: Record<number, string> = {
    4: "poppy seed", 8: "raspberry", 12: "lime", 16: "avocado", 20: "banana",
    24: "corn cob", 28: "aubergine", 32: "squash", 36: "honeydew", 40: "watermelon",
  };
  const nearestWeek = Object.keys(BABY_SIZES).map(Number).reduce((prev, curr) =>
    Math.abs(curr - currentWeek) < Math.abs(prev - currentWeek) ? curr : prev
  );
  const babySize = BABY_SIZES[nearestWeek] || "growing beautifully";

  return (
    <motion.div
      className="space-y-5 pb-4"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* Top Bar */}
      <motion.div variants={fadeUp}>
        <TopBar
          onAIChatPress={() => onNavigate("ai-chat")}
          onNotificationsPress={() => onNavigate("notifications")}
        />
      </motion.div>

      {/* Premium Hero Greeting Card */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden p-5"
        style={{
          borderRadius: 22,
          background:
            "radial-gradient(120% 100% at 100% 0%, hsla(11, 74%, 63%, 0.28) 0%, hsla(11, 74%, 63%, 0) 45%), radial-gradient(120% 120% at 0% 100%, hsla(153, 55%, 40%, 0.35) 0%, hsla(153, 55%, 40%, 0) 55%), linear-gradient(150deg, hsl(153, 45%, 18%) 0%, hsl(153, 50%, 14%) 55%, hsl(160, 55%, 10%) 100%)",
          boxShadow: "0 18px 48px -20px hsla(153, 60%, 8%, 0.55), inset 0 1px 0 hsla(0,0%,100%,0.06)",
        }}
      >
        {/* Decorative orbs */}
        <div className="absolute -top-10 -right-10 w-[160px] h-[160px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsla(11,74%,63%,0.25), transparent 70%)", filter: "blur(4px)" }} />
        <div className="absolute -bottom-14 -left-10 w-[180px] h-[180px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsla(140,40%,60%,0.18), transparent 70%)", filter: "blur(6px)" }} />
        {/* Fine hairline shine */}
        <div className="absolute top-0 left-6 right-6 h-px pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)" }} />

        <div className="relative z-10">
          <p className="text-white/55 text-[12px] font-sans tracking-wide">{greeting}</p>
          <h1 className="text-white text-[28px] font-serif mt-0.5 leading-tight">
            Hello, <span style={{ color: "hsl(var(--coral))" }}>{displayName}</span>
          </h1>
          {hasDueDate ? (
            <>
              <div className="flex items-center gap-2 mt-3.5">
                <span
                  className="text-[10.5px] font-sans font-semibold tracking-wider uppercase px-3 py-[5px] rounded-full inline-flex items-center gap-1.5"
                  style={{ background: "hsla(11, 74%, 63%, 0.18)", color: "hsl(var(--coral))", border: "1px solid hsla(11, 74%, 63%, 0.35)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--coral))", boxShadow: "0 0 8px hsl(var(--coral))" }} />
                  Week {currentWeek} · {trimester}
                </span>
                <span className="text-[10.5px] font-sans font-medium px-3 py-[5px] rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? "Due today!" : `${Math.abs(daysLeft)} days past`}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-sans font-semibold uppercase tracking-widest text-white/45">Pregnancy Progress</span>
                  <span className="text-[10px] font-sans font-bold text-white/80">{progressPercent}%</span>
                </div>
                <div className="h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.09)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.25)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, hsl(45 93% 60%), hsl(var(--coral)))", boxShadow: "0 0 10px hsla(11,74%,63%,0.6)" }}
                  />
                </div>
              </div>
              <p className="text-[11.5px] font-sans mt-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                Baby is about the size of a <span className="font-semibold" style={{ color: "hsl(var(--coral))" }}>{babySize}</span>
              </p>
            </>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate("profile")}
              className="flex items-center gap-1.5 mt-3 ios-press"
            >
              <span className="text-[13px] font-sans font-medium" style={{ color: "hsl(var(--coral))" }}>Set your due date →</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Level Badge */}
      <motion.div variants={fadeUp}>
        <button onClick={() => onNavigate("gamification")} className="w-full tend-card p-3 flex items-center gap-3 ios-press">
          <span className="text-[24px]">{level.badge}</span>
          <div className="flex-1">
            <p className="text-[13px] font-sans font-semibold" style={{ color: level.color }}>{level.name}</p>
            <p className="text-[10px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{points} points earned</p>
          </div>
          <IonIcon name="chevron-forward" size={16} style={{ color: "hsl(var(--text-muted))" }} />
        </button>
      </motion.div>

      {/* Quick Access Grid */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-2.5">QUICK ACCESS</p>
        <div
          className="grid grid-cols-4 gap-2 rounded-[20px] p-3"
          style={{
            background: "hsl(var(--surface))",
            boxShadow: "0 2px 12px -2px hsla(0,0%,0%,0.06)",
          }}
        >
          {QUICK_ACTIONS.map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-1.5 ios-press py-1"
            >
              <div
                className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center relative overflow-hidden"
                style={{ background: item.bg }}
              >
                <IonIcon name={item.icon} size={24} style={{ color: item.color }} />
              </div>
              <span className="text-[10px] font-sans font-semibold text-center leading-tight tracking-wide min-h-[2.4em] flex items-center justify-center" style={{ color: "hsl(var(--dark))" }}>
                {item.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Featured Actions */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-2.5">EXPLORE</p>
        <div className="space-y-2">
          {WEEKLY_HIGHLIGHTS.map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate(item.id)}
              className="w-full tend-card p-4 flex items-center gap-3 ios-press text-left"
            >
              <div
                className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                style={{
                  background: item.color === "coral" ? "hsl(var(--light-coral))" : "hsl(var(--light-green))",
                }}
              >
                <IonIcon
                  name={item.icon}
                  size={20}
                  style={{ color: item.color === "coral" ? "hsl(var(--coral))" : "hsl(var(--green))" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>{item.label}</p>
                <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{item.desc}</p>
              </div>
              <IonIcon name="chevron-forward" size={16} style={{ color: "hsl(var(--text-muted))" }} />
            </motion.button>
          ))}
        </div>
      </motion.div>


    </motion.div>
  );
};

export default HomeScreen;

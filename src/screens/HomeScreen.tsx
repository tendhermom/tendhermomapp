import { useMemo } from "react";
import TopBar from "@/components/navigation/TopBar";
import { useAuthStore } from "@/stores/authStore";
import IonIcon from "@/components/IonIcon";
import { motion } from "framer-motion";
import community1st from "@/assets/community-1st-trimester.jpg";
import community2nd from "@/assets/community-2nd-trimester.jpg";
import community3rd from "@/assets/community-3rd-trimester.jpg";
import communityPostpartum from "@/assets/community-postpartum.jpg";

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

const COMMUNITY_CHANNELS = [
  { id: "first_trimester", name: "1st Trimester", subtitle: "Weeks 1–13", image: community1st },
  { id: "second_trimester", name: "2nd Trimester", subtitle: "Weeks 14–26", image: community2nd },
  { id: "third_trimester", name: "3rd Trimester", subtitle: "Weeks 27–40", image: community3rd },
  { id: "postpartum", name: "Postpartum", subtitle: "After birth", image: communityPostpartum },
];

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const currentWeek = useAuthStore((s) => s.getCurrentWeek());
  const daysLeft = useAuthStore((s) => s.getDaysRemaining());

  const displayName = user?.full_name?.split(" ")[0] || "there";
  const greeting = getGreeting();
  const trimester = currentWeek <= 13 ? "1st Trimester" : currentWeek <= 26 ? "2nd Trimester" : currentWeek <= 40 ? "3rd Trimester" : "Postpartum";
  const hasDueDate = !!user?.due_date;

  const userStage = user?.current_stage || "first_trimester";

  return (
    <motion.div
      className="space-y-6 pb-4"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* Top Bar */}
      <motion.div variants={fadeUp}>
        <TopBar onNotificationsPress={() => onNavigate("notifications")} />
      </motion.div>

      {/* Hero Greeting Bar */}
      <motion.div
        variants={fadeUp}
        className="rounded-[20px] p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, hsl(153 42% 22%), hsl(153 42% 30%), hsl(153 38% 26%))",
          boxShadow: "0 8px 32px -8px hsla(153,42%,20%,0.5)",
        }}
      >
        <div className="absolute -top-20 -right-20 w-[160px] h-[160px] rounded-full" style={{ background: "radial-gradient(circle, hsla(0,0%,100%,0.06) 0%, transparent 70%)" }} />
        <p className="text-white/50 text-[13px] font-sans">{greeting}</p>
        <h1 className="text-white text-[26px] font-serif mt-0.5">
          Hello, <span style={{ color: "hsl(var(--coral))" }}>{displayName}</span>
        </h1>
        {hasDueDate ? (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[11px] font-sans font-semibold tracking-wide uppercase px-3 py-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "hsl(var(--coral))" }}>
              Week {currentWeek} · {trimester}
            </span>
            <span className="text-[11px] font-sans font-medium px-3 py-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
              {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? "Due today!" : `${Math.abs(daysLeft)} days since due date`}
            </span>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate("profile")}
            className="flex items-center gap-1.5 mt-3 ios-press"
          >
            <span className="text-[13px] font-sans font-medium" style={{ color: "hsl(var(--coral))" }}>Set your due date →</span>
          </motion.button>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-3">QUICK ACTIONS</p>

        {/* Triage Card */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate("triage")}
          className="w-full rounded-[18px] p-4 flex items-center gap-4 text-left ios-press mb-3"
          style={{
            background: "hsl(var(--surface))",
            boxShadow: "0 1px 3px hsla(0,0%,0%,0.04), 0 4px 16px -2px hsla(153,42%,30%,0.08)",
          }}
        >
          <div
            className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(153 42% 94%), hsl(153 42% 88%))" }}
          >
            <IonIcon name="medkit-outline" size={24} style={{ color: "hsl(var(--green))" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-[16px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>Check a symptom</h3>
            <p className="text-[12px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
              Something feels off? Get a clinical assessment in under 2 minutes.
            </p>
          </div>
          <IonIcon name="chevron-forward" size={16} style={{ color: "hsl(var(--text-muted))" }} />
        </motion.button>

        {/* Baby Shower Card */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate("baby-shower")}
          className="w-full rounded-[18px] p-4 flex items-center gap-4 text-left ios-press relative overflow-hidden"
          style={{
            background: "hsl(var(--coral))",
            boxShadow: "0 6px 24px -4px hsla(11,74%,63%,0.45)",
          }}
        >
          <div className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
            <IonIcon name="gift-outline" size={24} style={{ color: "white" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-[16px] font-bold font-sans text-white">Baby Shower</h3>
            <p className="text-[12px] font-sans mt-0.5 text-white/70">
              Celebrate new arrivals and share your bundle of joy.
            </p>
          </div>
          <IonIcon name="chevron-forward" size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
        </motion.button>
      </motion.div>

      {/* Communities — horizontal carousel */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-dark text-[20px]">Communities</h2>
          <button onClick={() => onNavigate("community")} className="ios-press">
            <span className="text-[13px] font-semibold font-sans" style={{ color: "hsl(var(--green))" }}>See all</span>
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
          {COMMUNITY_CHANNELS.map((ch, i) => {
            const isUserStage = ch.id === userStage;
            return (
              <motion.button
                key={ch.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.06, type: "spring", stiffness: 300, damping: 28 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onNavigate("community")}
                className="rounded-[18px] p-4 flex-shrink-0 flex flex-col gap-3 ios-press relative"
                style={{
                  width: 140,
                  background: "hsl(var(--surface))",
                  boxShadow: "0 1px 3px hsla(0,0%,0%,0.04), 0 4px 16px -2px hsla(0,0%,0%,0.06)",
                }}
              >
                {isUserStage && (
                  <span
                    className="absolute top-2.5 right-2.5 z-10 text-[8px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.9)", color: "hsl(var(--green))" }}
                  >
                    You
                  </span>
                )}
                <img
                  src={ch.image}
                  alt={ch.name}
                  className="w-full h-[90px] object-cover rounded-t-[18px]"
                />
                <div className="p-3">
                  <h3 className="text-[14px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>{ch.name}</h3>
                  <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{ch.subtitle}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* How Triage Works */}
      <motion.div variants={fadeUp}>
        <h2 className="font-serif text-dark text-[20px] mb-3">How triage works</h2>
        <div className="rounded-[18px] p-5 space-y-4" style={{ background: "hsl(var(--surface))", boxShadow: "0 1px 3px hsla(0,0%,0%,0.04), 0 4px 16px -2px hsla(0,0%,0%,0.06)" }}>
          {[
            { step: "1", text: "Tell us what you're feeling" },
            { step: "2", text: "Answer 3–4 focused questions" },
            { step: "3", text: "Get a clear, medically-reviewed answer" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, hsl(153 42% 94%), hsl(153 42% 88%))" }}>
                <span className="text-[13px] font-bold font-sans" style={{ color: "hsl(var(--green))" }}>{item.step}</span>
              </div>
              <p className="text-[14px] font-sans pt-1" style={{ color: "hsl(var(--dark))" }}>{item.text}</p>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2" style={{ borderTop: "0.5px solid hsl(var(--border))" }}>
            <IonIcon name="shield-checkmark" size={16} style={{ color: "hsl(var(--green))" }} />
            <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              Reviewed by Dr. Adaeze Nwosu, FWACS · LUTH
            </p>
          </div>
        </div>

        {/* Outcome Legend */}
        <div className="rounded-[18px] p-4 mt-2.5 space-y-2.5" style={{ background: "hsl(var(--surface))", boxShadow: "0 1px 3px hsla(0,0%,0%,0.04), 0 4px 16px -2px hsla(0,0%,0%,0.06)" }}>
          {[
            { color: "hsl(var(--green))", text: "You're safe — monitor and rest at home." },
            { color: "hsl(38, 92%, 50%)", text: "Needs attention — call your doctor today." },
            { color: "hsl(var(--coral))", text: "Go now — hospital immediately. Do not wait." },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <p className="text-[12px] font-sans" style={{ color: "hsl(var(--dark))" }}>{item.text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HomeScreen;

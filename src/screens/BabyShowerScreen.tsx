import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import BabyShowerCard from "@/components/cards/BabyShowerCard";
import { useAuthStore } from "@/stores/authStore";

interface BabyShowerScreenProps {
  onBack: () => void;
}

const allBabies = [
  { name: "Chidi", parentName: "Ngozi & Emeka", date: "March 2026", imageUrl: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop", gender: "boy" as const },
  { name: "Adaeze", parentName: "Funke & Tunde", date: "March 2026", imageUrl: "https://images.unsplash.com/photo-1544126592-807ade215a0b?w=400&h=300&fit=crop", gender: "girl" as const },
  { name: "Obioma", parentName: "Chioma & Uche", date: "March 2026", imageUrl: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop", gender: "boy" as const },
  { name: "Nneka", parentName: "Amaka & Ife", date: "March 2026", imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop", gender: "girl" as const },
  { name: "Tunde", parentName: "Bola & Segun", date: "February 2026", imageUrl: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop", gender: "boy" as const },
  { name: "Ife", parentName: "Yemi & Ade", date: "February 2026", imageUrl: "https://images.unsplash.com/photo-1544126592-807ade215a0b?w=400&h=300&fit=crop", gender: "girl" as const },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const BabyShowerScreen = ({ onBack }: BabyShowerScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan_type === "premium";

  return (
    <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.88 }} onClick={onBack} className="ios-press">
          <IonIcon name="chevron-back" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1 className="font-serif text-dark text-[24px] flex-1">Baby Shower 🎉</h1>
      </motion.div>

      {/* Premium banner */}
      {!isPremium && (
        <motion.div
          variants={fadeUp}
          className="tend-card p-4 flex items-center gap-3"
          style={{ background: "hsl(var(--light-coral))" }}
        >
          <IonIcon name="lock-closed" size={20} style={{ color: "hsl(var(--coral))" }} />
          <div className="flex-1">
            <p className="text-[13px] font-semibold font-sans" style={{ color: "hsl(var(--coral))" }}>
              Premium Feature
            </p>
            <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              Upgrade to celebrate & post your baby
            </p>
          </div>
        </motion.div>
      )}

      {/* This Month */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-dark text-[18px]">March 2026</h2>
          <div className="px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--light-coral))" }}>
            <span className="text-[11px] font-bold font-sans" style={{ color: "hsl(var(--coral))" }}>
              🎉 {allBabies.filter((b) => b.date === "March 2026").length} babies
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {allBabies
            .filter((b) => b.date === "March 2026")
            .map((baby, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.07, type: "spring" as const, stiffness: 300, damping: 28 }}
              >
                <BabyShowerCard {...baby} />
              </motion.div>
            ))}
        </div>
      </motion.div>

      {/* Previous Month */}
      <motion.div variants={fadeUp}>
        <h2 className="font-serif text-dark text-[18px] mb-3">February 2026</h2>
        <div className="grid grid-cols-2 gap-3">
          {allBabies
            .filter((b) => b.date === "February 2026")
            .map((baby, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.07, type: "spring" as const, stiffness: 300, damping: 28 }}
              >
                <BabyShowerCard {...baby} />
              </motion.div>
            ))}
        </div>
      </motion.div>

      {/* Post your baby CTA */}
      {isPremium && (
        <motion.div variants={fadeUp}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="w-full py-4 rounded-2xl text-[15px] font-semibold font-sans ios-press flex items-center justify-center gap-2"
            style={{ background: "hsl(var(--coral))", color: "white" }}
          >
            <IonIcon name="camera-outline" size={20} style={{ color: "white" }} />
            Post Your Baby
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BabyShowerScreen;

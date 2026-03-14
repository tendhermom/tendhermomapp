import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import QuoteBlock from "@/components/cards/QuoteBlock";

interface RecordsScreenProps {
  onNavigate: (tab: string) => void;
  onBack: () => void;
}

const weeklyUpdate = {
  week: 24,
  development: [
    "Baby can now hear sounds from outside the womb",
    "Lungs are developing branches and surfactant",
    "Baby is about 30cm long and weighs ~600g",
    "Taste buds are fully formed",
  ],
};

const symptoms = [
  "Back pain",
  "Braxton Hicks contractions",
  "Swollen feet and ankles",
  "Increased appetite",
  "Difficulty sleeping",
];

const nigerianFoods = [
  { name: "Egusi soup with spinach", benefit: "Iron & protein", icon: "nutrition" },
  { name: "Beans & plantain", benefit: "Folate & potassium", icon: "leaf" },
  { name: "Okra soup", benefit: "Fiber & vitamins", icon: "nutrition" },
  { name: "Moi moi", benefit: "Protein & B vitamins", icon: "restaurant" },
  { name: "Garden egg", benefit: "Low calorie, high fiber", icon: "leaf" },
];

const warningFlags = [
  "Persistent vomiting",
  "Vaginal bleeding",
  "Severe headache with vision changes",
  "Reduced fetal movement",
];

const RecordsScreen = ({ onNavigate, onBack }: RecordsScreenProps) => {
  return (
    <div className="space-y-6 pb-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center ios-press"
          style={{ background: "hsl(var(--light-green))" }}
        >
          <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--green))" }} />
        </motion.button>
        <div>
          <h1 className="font-serif text-dark" style={{ fontSize: "26px" }}>Health Records</h1>
          <p className="text-text-muted text-[13px] font-sans">Your pregnancy journey</p>
        </div>
      </div>

      {/* Hero week card */}
      <div className="hero-card p-5">
        <div className="relative z-10">
          <span className="label-caps" style={{ color: "rgba(255,255,255,0.5)" }}>
            Baby Development
          </span>
          <h3 className="text-white text-[22px] font-serif mt-2">Week {weeklyUpdate.week}</h3>
          <div className="space-y-2.5 mt-4">
            {weeklyUpdate.development.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <IonIcon name="checkmark-circle" size={16} style={{ color: "hsl(var(--coral))", marginTop: "2px" }} />
                <span className="text-white/80 text-[14px] font-sans">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Symptoms */}
      <div>
        <h2 className="font-serif text-dark text-[20px] mb-3">What You May Feel</h2>
        <div className="flex flex-wrap gap-2">
          {symptoms.map((s, i) => (
            <span
              key={i}
              className="text-[13px] font-medium font-sans px-3.5 py-[8px] rounded-full"
              style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Nigerian foods */}
      <div>
        <h2 className="font-serif text-dark text-[20px] mb-3">Nigerian Foods for You</h2>
        <div className="tend-card overflow-hidden">
          {nigerianFoods.map((food, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-[18px] py-[14px]"
              style={{ borderBottom: i < nigerianFoods.length - 1 ? "0.5px solid hsl(var(--border))" : "none" }}
            >
              <div className="flex items-center gap-3">
                <IonIcon name={food.icon} size={18} style={{ color: "hsl(var(--green))" }} />
                <span className="text-dark text-[14px] font-sans">{food.name}</span>
              </div>
              <span
                className="label-caps px-2 py-[3px] rounded-full"
                style={{
                  background: "hsl(var(--light-green))",
                  color: "hsl(var(--green))",
                }}
              >
                {food.benefit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning signs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <IonIcon name="alert-circle" size={20} style={{ color: "hsl(var(--coral))" }} />
          <h2 className="font-serif text-dark text-[20px]">Warning Signs</h2>
        </div>
        <div className="tend-card overflow-hidden">
          {warningFlags.map((sign, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-[18px] py-[14px]"
              style={{ borderBottom: i < warningFlags.length - 1 ? "0.5px solid hsl(var(--border))" : "none" }}
            >
              <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: "hsl(var(--coral))" }} />
              <span className="text-dark text-[14px] font-sans">{sign}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quote */}
      <QuoteBlock quote="Every day you're one step closer to meeting your little one. You're doing amazing." />

      {/* Premium AI Banner */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="hero-card p-5 cursor-pointer"
      >
        <div className="relative z-10 flex items-center gap-3.5">
          <div
            className="w-[46px] h-[46px] rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <IonIcon name="sparkles" size={22} style={{ color: "hsl(var(--coral))" }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-white text-[15px] font-semibold font-sans">AI Health Assistant</h4>
              <span
                className="label-caps px-1.5 py-[2px] rounded-full"
                style={{ background: "hsl(var(--coral))", color: "white", fontSize: "8px" }}
              >
                Premium
              </span>
            </div>
            <p className="text-white/50 text-[12px] font-sans mt-0.5">Ask anything about your pregnancy</p>
          </div>
          <IonIcon name="chevron-forward" size={18} style={{ color: "rgba(255,255,255,0.3)" }} />
        </div>
      </motion.div>
    </div>
  );
};

export default RecordsScreen;

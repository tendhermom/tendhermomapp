import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, Heart } from "lucide-react";
import QuoteBlock from "@/components/cards/QuoteBlock";

const weeklyUpdate = {
  week: 24,
  development: [
    "Baby can now hear sounds from outside the womb 👂",
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
  { name: "Egusi soup with spinach", benefit: "Iron & protein" },
  { name: "Beans & plantain", benefit: "Folate & potassium" },
  { name: "Okra soup", benefit: "Fiber & vitamins" },
  { name: "Moi moi", benefit: "Protein & B vitamins" },
  { name: "Garden egg", benefit: "Low calorie, high fiber" },
];

const warningFlags = [
  "Persistent vomiting",
  "Vaginal bleeding",
  "Severe headache with vision changes",
  "Reduced fetal movement",
];

const RecordsScreen = () => {
  return (
    <div className="space-y-5 pb-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Records</h2>
        <p className="text-sm text-muted-foreground">
          Your pregnancy journey, week by week
        </p>
      </div>

      {/* Weekly development */}
      <div className="bg-card rounded-xl card-shadow p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          🍼 Week {weeklyUpdate.week} Development
        </h3>
        <ul className="space-y-2">
          {weeklyUpdate.development.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Symptoms */}
      <div className="bg-card rounded-xl card-shadow p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          🤰 What You May Feel
        </h3>
        <div className="flex flex-wrap gap-2">
          {symptoms.map((s, i) => (
            <span
              key={i}
              className="text-xs font-medium bg-secondary/20 text-foreground px-3 py-1.5 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Nigerian foods */}
      <div className="bg-card rounded-xl card-shadow p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          🍲 Recommended Nigerian Foods
        </h3>
        <div className="space-y-2.5">
          {nigerianFoods.map((food, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{food.name}</span>
              <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {food.benefit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning signs */}
      <div className="bg-accent/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Warning Signs
          </h3>
        </div>
        <ul className="space-y-2">
          {warningFlags.map((sign, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              {sign}
            </li>
          ))}
        </ul>
      </div>

      <QuoteBlock quote="Every day you're one step closer to meeting your little one. You're doing amazing! 💚" />

      {/* Premium GPT Chat banner */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="bg-primary rounded-xl p-4 flex items-center gap-3 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-primary-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-primary-foreground">
              AI Health Assistant
            </h4>
            <span className="text-[9px] font-semibold bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">
              PREMIUM
            </span>
          </div>
          <p className="text-xs text-primary-foreground/70 mt-0.5">
            Ask anything about your pregnancy
          </p>
        </div>
        <Heart size={16} className="text-primary-foreground/50" />
      </motion.div>
    </div>
  );
};

export default RecordsScreen;

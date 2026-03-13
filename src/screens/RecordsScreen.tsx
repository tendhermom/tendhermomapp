import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
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

const RecordsScreen = () => {
  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div>
        <h1 className="ios-large-title text-foreground" style={{ fontSize: "28px" }}>
          Records
        </h1>
        <p className="ios-footnote text-muted-foreground mt-1">
          Your pregnancy journey, week by week
        </p>
      </div>

      {/* Weekly development - iOS grouped */}
      <div className="ios-card-elevated p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🍼</span>
          <h3 className="ios-title text-foreground">Week {weeklyUpdate.week} Development</h3>
        </div>
        <div className="space-y-2.5">
          {weeklyUpdate.development.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <IonIcon name="checkmark-circle" size={16} style={{ color: "hsl(var(--forest))", marginTop: "2px" }} />
              <span className="ios-body text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Symptoms */}
      <div className="ios-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🤰</span>
          <h3 className="ios-title text-foreground">What You May Feel</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {symptoms.map((s, i) => (
            <span
              key={i}
              className="ios-footnote font-medium px-3 py-[7px] rounded-full"
              style={{ background: "hsl(var(--ios-grouped-bg))", color: "hsl(var(--text-secondary))" }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Nigerian foods - iOS grouped list */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🍲</span>
          <h3 className="ios-title text-foreground">Nigerian Foods for You</h3>
        </div>
        <div className="ios-grouped">
          {nigerianFoods.map((food, i) => (
            <div key={i} className="ios-grouped-item flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IonIcon name={food.icon} size={18} style={{ color: "hsl(var(--forest))" }} />
                <span className="ios-body text-foreground">{food.name}</span>
              </div>
              <span
                className="ios-caption font-semibold px-2 py-[3px] rounded-full"
                style={{
                  background: "hsla(153, 42%, 30%, 0.08)",
                  color: "hsl(var(--forest))",
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
          <IonIcon name="alert-circle" size={18} style={{ color: "hsl(var(--coral))" }} />
          <h3 className="ios-title text-foreground">Warning Signs</h3>
        </div>
        <div className="ios-grouped">
          {warningFlags.map((sign, i) => (
            <div key={i} className="ios-grouped-item flex items-center gap-3">
              <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: "hsl(var(--coral))" }} />
              <span className="ios-body text-foreground">{sign}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quote */}
      <QuoteBlock quote="Every day you're one step closer to meeting your little one. You're doing amazing! 💚" />

      {/* Premium AI Banner */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(153, 42%, 30%), hsl(153, 42%, 22%))",
        }}
      >
        <div
          className="w-[44px] h-[44px] rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "hsla(0, 0%, 100%, 0.15)" }}
        >
          <IonIcon name="sparkles" size={22} style={{ color: "white" }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="ios-body font-semibold" style={{ color: "white" }}>AI Health Assistant</h4>
            <span
              className="ios-caption font-bold px-1.5 py-[1px] rounded-full"
              style={{
                background: "hsl(var(--coral))",
                color: "white",
                fontSize: "9px",
              }}
            >
              PRO
            </span>
          </div>
          <p className="ios-caption mt-0.5" style={{ color: "hsla(0,0%,100%,0.7)" }}>
            Ask anything about your pregnancy
          </p>
        </div>
        <IonIcon name="chevron-forward" size={18} style={{ color: "hsla(0,0%,100%,0.5)" }} />
      </motion.div>
    </div>
  );
};

export default RecordsScreen;

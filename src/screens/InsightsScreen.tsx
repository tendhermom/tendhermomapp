import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";
import { hapticLight } from "@/lib/despia";
import insightsHero from "@/assets/heroes/insights-hero.jpg.asset.json";
import triImg1 from "@/assets/heroes/trimester-1.jpg.asset.json";
import triImg2 from "@/assets/heroes/trimester-2.jpg.asset.json";
import triImg3 from "@/assets/heroes/trimester-3.jpg.asset.json";

interface InsightsScreenProps {
  onBack: () => void;
}

interface WeeklyTip {
  week: number;
  title: string;
  babyDev: string;
  motherTip: string;
  nutrition: string;
  warning: string;
  fact: string;
}

const WEEKLY_TIPS: WeeklyTip[] = [
  { week: 1, title: "Conception & Preparation", babyDev: "Fertilisation occurs — a single cell begins dividing rapidly.", motherTip: "Start taking 400mcg folic acid daily to prevent neural tube defects.", nutrition: "Leafy greens, fortified cereals, and legumes boost folate levels.", warning: "Avoid alcohol, smoking, and raw seafood from the start.", fact: "In Nigeria, only 67% of pregnant women attend at least 4 antenatal visits (WHO 2023)." },
  { week: 2, title: "Implantation Week", babyDev: "The blastocyst implants into the uterine wall around day 6-10.", motherTip: "You may notice light spotting — this is normal implantation bleeding.", nutrition: "Iron-rich foods like spinach & liver help build blood reserves early.", warning: "Avoid self-medicating — many common drugs are unsafe in early pregnancy.", fact: "Maternal mortality in sub-Saharan Africa is 545 per 100,000 live births — 66× higher than Europe." },
  { week: 3, title: "Cells Multiply", babyDev: "Three layers form: ectoderm (skin/brain), mesoderm (bones/muscles), endoderm (organs).", motherTip: "Fatigue is common — your body is working overtime to grow new blood vessels.", nutrition: "Increase protein intake with eggs, beans, and lean meats.", warning: "Avoid herbal teas & supplements not approved by your doctor.", fact: "Early registration for antenatal care within the first trimester improves outcomes by 40%." },
  { week: 4, title: "Heart Begins to Form", babyDev: "Baby is the size of a poppy seed. The neural tube and primitive heart start forming.", motherTip: "A missed period is the most common first sign. Take a pregnancy test.", nutrition: "Calcium from milk, yoghurt, and ogi (pap) supports bone development.", warning: "Avoid hot baths and saunas — overheating can affect neural tube development.", fact: "Haemorrhage accounts for 25% of all maternal deaths in Nigeria." },
  { week: 5, title: "Tiny Heartbeat", babyDev: "Heart begins beating! Brain, spinal cord, and major organs start forming.", motherTip: "Morning sickness may begin. Eat small, frequent meals to manage nausea.", nutrition: "Ginger tea and dry crackers can help with nausea. Stay hydrated.", warning: "Report severe vomiting that prevents keeping food down (hyperemesis gravidarum).", fact: "Only 43% of Nigerian women deliver in a health facility — home births carry 3× higher risk." },
  { week: 6, title: "Facial Features Emerge", babyDev: "Nose, mouth, and ears begin to form. Baby is 5mm long.", motherTip: "Breast tenderness and mood swings are normal as hormones surge.", nutrition: "Vitamin B6 from bananas, potatoes, and fish helps manage nausea.", warning: "Bleeding with cramping needs immediate medical attention.", fact: "Preeclampsia affects 5-8% of pregnancies and is a leading cause of maternal death globally." },
  { week: 7, title: "Arms & Legs Bud", babyDev: "Arm and leg buds appear. Brain is growing rapidly — 100 cells/minute.", motherTip: "You may urinate more frequently as the uterus presses on the bladder.", nutrition: "DHA-rich foods (mackerel, sardines) support baby's brain development.", warning: "Avoid X-rays and exposure to chemicals or pesticides.", fact: "Anaemia in pregnancy affects 56% of Nigerian women, increasing risk of complications." },
  { week: 8, title: "Baby Moves!", babyDev: "Baby is the size of a raspberry. Fingers and toes begin forming. First movements!", motherTip: "Schedule your dating scan to confirm due date and check for twins.", nutrition: "Zinc from pumpkin seeds and groundnuts supports immune development.", warning: "Report any fluid leaking or unusual discharge to your doctor.", fact: "Proper nutrition in the first trimester reduces risk of low birth weight by 30%." },
  { week: 9, title: "Organs Develop", babyDev: "All essential organs have formed. Baby graduates from embryo to fetus!", motherTip: "Food aversions are normal. Eat what you can tolerate.", nutrition: "Vitamin C from oranges and tomatoes helps iron absorption.", warning: "Avoid unpasteurised dairy and undercooked meats (listeria/toxoplasmosis risk).", fact: "Nigeria has the 2nd highest number of maternal deaths globally, with over 82,000 deaths annually." },
  { week: 10, title: "Vital Organs Mature", babyDev: "Kidneys produce urine. Teeth start forming under the gums.", motherTip: "Constipation is common — increase fibre and water intake.", nutrition: "Whole grains, fruits, and vegetables provide essential fibre.", warning: "Don't skip your blood work panel — it screens for critical conditions.", fact: "Sickle cell disease affects 2-3% of Nigerian newborns — screening saves lives." },
  { week: 11, title: "Almost Human", babyDev: "Baby looks like a tiny human! Ears move to their final position.", motherTip: "Energy levels may start improving. The first trimester fatigue eases.", nutrition: "Iodine from iodised salt supports thyroid function and brain development.", warning: "Inform your doctor about any family history of genetic conditions.", fact: "90% of maternal deaths could be prevented with access to basic healthcare and skilled birth attendants." },
  { week: 12, title: "First Trimester Complete", babyDev: "Baby is the size of a lime. Reflexes develop — baby can open and close fingers.", motherTip: "Risk of miscarriage drops significantly after week 12. Many women share the news now.", nutrition: "Celebrate with a balanced meal! Continue your prenatal vitamins.", warning: "Nuchal translucency scan should be done between weeks 11-14.", fact: "Women who complete all antenatal visits are 5× more likely to have safe deliveries." },
  { week: 13, title: "Second Trimester Begins", babyDev: "Vocal cords form. Intestines move into the abdomen.", motherTip: "Many women feel renewed energy — the 'honeymoon trimester' begins!", nutrition: "Increase calorie intake by 300 cal/day — you're eating for growth, not two.", warning: "Begin sleeping on your left side to improve blood flow to baby.", fact: "Eclampsia seizures kill 50,000 women per year — early blood pressure monitoring saves lives." },
  { week: 14, title: "Unique Fingerprints", babyDev: "Baby develops unique fingerprints! Facial muscles allow squinting and frowning.", motherTip: "A growing belly means you may need maternity clothes soon.", nutrition: "Magnesium from dark chocolate, nuts, and beans prevents leg cramps.", warning: "Round ligament pain (sharp side pains) is normal but report persistent pain.", fact: "In Nigeria, only 39% of births are attended by a skilled health professional." },
  { week: 15, title: "Sensing Light", babyDev: "Baby can sense light through closed eyelids. Bones begin to harden.", motherTip: "You may notice a 'pregnancy glow' from increased blood volume.", nutrition: "Phosphorus from fish and poultry strengthens developing bones.", warning: "Stay hydrated — dehydration can trigger Braxton Hicks contractions.", fact: "Adolescent mothers (under 18) face 2× higher risk of maternal death." },
  { week: 16, title: "Gender May Be Visible", babyDev: "Baby is 11cm long. External genitalia are forming — gender may be visible on scan.", motherTip: "You might feel 'quickening' — baby's first flutters of movement!", nutrition: "Vitamin A from carrots and sweet potatoes supports baby's eye development.", warning: "Avoid excessive vitamin A supplements — toxicity can cause birth defects.", fact: "Skilled midwifery alone could prevent 83% of maternal deaths, stillbirths, and newborn deaths." },
  { week: 17, title: "Fat Layer Forms", babyDev: "Baby starts storing fat. Sweat glands develop. Umbilical cord strengthens.", motherTip: "Back pain may start as your centre of gravity shifts. Wear supportive shoes.", nutrition: "Omega-3 from walnuts and flaxseeds support brain and eye development.", warning: "Report any sudden swelling in hands, face, or feet — could be preeclampsia.", fact: "Postpartum haemorrhage accounts for nearly 34% of maternal deaths in Nigeria." },
  { week: 18, title: "Baby Hears You", babyDev: "Ears are functional — baby can hear your heartbeat and voice!", motherTip: "Talk and sing to your baby. Play music — they're listening.", nutrition: "Potassium from plantains and bananas helps regulate blood pressure.", warning: "Anatomy scan this week — ensure all organs are developing normally.", fact: "Music and talking to baby in utero promotes neural development and bonding." },
  { week: 19, title: "Vernix Forms", babyDev: "A waxy coating (vernix caseosa) protects baby's skin from amniotic fluid.", motherTip: "Skin changes like linea nigra (dark line on belly) are normal.", nutrition: "Vitamin E from avocado and almonds protects skin and supports growth.", warning: "Monitor fetal movements — establish a pattern you can track.", fact: "Women with at least 8 antenatal contacts have better maternal and perinatal outcomes (WHO)." },
  { week: 20, title: "Halfway There!", babyDev: "Baby is the size of a banana — about 25cm from head to toe!", motherTip: "You're halfway! Review your anatomy scan results with your doctor.", nutrition: "Celebrate this milestone — and ensure you're getting 27mg of iron daily.", warning: "Preeclampsia risk increases after week 20 — monitor blood pressure.", fact: "Half of all maternal deaths occur within 24 hours of delivery." },
  { week: 21, title: "Active Kicks", babyDev: "Baby's movements become stronger and more coordinated.", motherTip: "Start counting kicks — 10 movements in 2 hours is a good sign.", nutrition: "Selenium from Brazil nuts supports thyroid function during pregnancy.", warning: "Reduced fetal movement should always be checked by your healthcare provider.", fact: "Access to emergency obstetric care could prevent 75% of maternal deaths." },
  { week: 22, title: "Sleep Cycles Form", babyDev: "Baby develops distinct sleep and wake cycles — often opposite to yours!", motherTip: "Heartburn may increase as baby pushes against your stomach.", nutrition: "Small, frequent meals and avoiding spicy food helps with heartburn.", warning: "Report chest pain, difficulty breathing, or persistent headaches immediately.", fact: "Sepsis/infection causes 11% of maternal deaths — hand hygiene and clean delivery save lives." },
  { week: 23, title: "Hearing Sharpens", babyDev: "Baby responds to loud sounds with movement. Lungs are practising breathing.", motherTip: "Swelling in feet and ankles is common — elevate your legs when resting.", nutrition: "Copper from cashews and cocoa supports red blood cell production.", warning: "Signs of preterm labour: regular contractions, pressure, or fluid leaking.", fact: "Babies born at 23 weeks have a 30-50% survival rate with intensive neonatal care." },
  { week: 24, title: "Viability Milestone", babyDev: "Baby reaches viability — could survive outside the womb with intensive care.", motherTip: "Glucose tolerance test this week — screens for gestational diabetes.", nutrition: "Complex carbs from brown rice and oats provide steady energy.", warning: "Gestational diabetes affects 1 in 7 pregnancies — early detection is key.", fact: "Gestational diabetes increases the risk of C-section delivery by 30%." },
  { week: 25, title: "Baby Responds to Touch", babyDev: "Baby responds to your touch on the belly. Hair begins growing!", motherTip: "Practice relaxation techniques — prenatal yoga or deep breathing.", nutrition: "Choline from eggs supports baby's brain development significantly.", warning: "Persistent itching, especially on palms and feet, could indicate liver issues.", fact: "Mental health conditions affect 1 in 5 pregnant women — support saves lives." },
  { week: 26, title: "Eyes Open", babyDev: "Baby opens eyes for the first time! Can see light filtering through the womb.", motherTip: "Difficulty sleeping is common. Use pillows for support and comfort.", nutrition: "Manganese from pineapple and beans supports bone and cartilage formation.", warning: "Rh-negative mothers need Rhogam injection around now to prevent complications.", fact: "Rhesus incompatibility causes severe anaemia in newborns if untreated." },
  { week: 27, title: "Third Trimester Eve", babyDev: "Baby hiccups regularly — a sign of lung development! Brain activity surges.", motherTip: "Start thinking about your birth plan — hospital, water birth, or home birth.", nutrition: "Fibre-rich foods help with the constipation that worsens in late pregnancy.", warning: "Braxton Hicks contractions increase — know the difference from real labour.", fact: "In Nigeria, the ratio of doctors to patients is 1:5,000 vs WHO's recommended 1:600." },
  { week: 28, title: "Third Trimester!", babyDev: "Baby can dream! REM sleep begins. Weight gain accelerates rapidly.", motherTip: "Visits become bi-weekly now. Start preparing your hospital bag.", nutrition: "Vitamin K from leafy greens is crucial for blood clotting.", warning: "Bi-weekly checkups help catch complications like preeclampsia early.", fact: "28% of neonatal deaths are caused by preterm birth complications." },
  { week: 29, title: "Brain Growth Surge", babyDev: "Brain triples in weight over the next 11 weeks. Baby stores calcium and iron.", motherTip: "Shortness of breath increases as baby pushes up against your diaphragm.", nutrition: "Increase iron intake — baby is building their own iron reserves now.", warning: "Severe headaches with visual disturbances need immediate medical attention.", fact: "Iron deficiency anaemia in the third trimester doubles the risk of preterm delivery." },
  { week: 30, title: "Eyes Track Light", babyDev: "Baby can distinguish between light and dark. Practises breathing movements.", motherTip: "Pelvic floor exercises (Kegels) prepare your body for delivery.", nutrition: "Biotin from sweet potatoes supports cell growth in the final stretch.", warning: "Growth scan to check baby's size — too small or too large needs monitoring.", fact: "Obstructed labour causes 8% of maternal deaths — pelvimetry can identify risks." },
  { week: 31, title: "Baby's Senses Sharpen", babyDev: "All five senses are functional. Baby processes information and responds to stimuli.", motherTip: "Braxton Hicks may feel stronger — practice breathing through them.", nutrition: "Thiamine (B1) from whole grains supports baby's brain development.", warning: "Leaking fluid could indicate premature rupture of membranes — call your doctor.", fact: "Continuous support during labour reduces C-section rates by 25%." },
  { week: 32, title: "Toenails Grow", babyDev: "Baby has toenails, fingernails, and real hair. Weighs about 1.7kg.", motherTip: "Carpal tunnel syndrome may affect your wrists — wrist splints can help.", nutrition: "Riboflavin (B2) from dairy and almonds supports energy production.", warning: "Baby should be head-down by now — breech position may need intervention.", fact: "External cephalic version (ECV) successfully turns 50% of breech babies." },
  { week: 33, title: "Immune System Builds", babyDev: "Baby receives antibodies from you, building their immune system.", motherTip: "Difficulty finding a comfortable sleeping position is normal at this stage.", nutrition: "Probiotics from yoghurt support digestive health for you and baby.", warning: "Signs of infection (fever, chills, painful urination) need prompt treatment.", fact: "Newborns receive crucial immunity through breast milk in the first 6 months." },
  { week: 34, title: "Lungs Maturing", babyDev: "Lungs produce surfactant — essential for breathing after birth.", motherTip: "Nesting instinct may kick in — channel the energy but don't overexert.", nutrition: "Niacin (B3) from chicken and fish supports digestion and energy.", warning: "Group B Strep test should be done between weeks 35-37.", fact: "GBS infection is the leading cause of serious newborn infections in the first week." },
  { week: 35, title: "Rapid Weight Gain", babyDev: "Baby gains about 250g per week now. Most organs are fully developed.", motherTip: "Packing your hospital bag: documents, baby clothes, snacks, phone charger.", nutrition: "Pantothenic acid (B5) from avocado supports hormone production.", warning: "Preterm labour signs: contractions every 10 min, back pain, pelvic pressure.", fact: "Kangaroo care (skin-to-skin) for preterm babies reduces mortality by 36%." },
  { week: 36, title: "Baby Drops", babyDev: "Baby 'drops' into the pelvis (lightening). Head engages in preparation for birth.", motherTip: "Breathing becomes easier but pelvic pressure increases. Weekly visits start.", nutrition: "Dates consumption in the last 4 weeks may promote cervical ripening.", warning: "Track fetal movements daily — any significant decrease needs assessment.", fact: "Women who attend all recommended antenatal visits have 50% fewer complications." },
  { week: 37, title: "Full Term!", babyDev: "Baby is full term! All systems are ready for life outside the womb.", motherTip: "Review signs of labour: regular contractions, water breaking, bloody show.", nutrition: "Stay hydrated — coconut water provides electrolytes naturally.", warning: "Don't travel far from your hospital — baby could arrive any time now.", fact: "Only 57% of Nigerian women make a birth preparedness plan." },
  { week: 38, title: "Ready for the World", babyDev: "Baby sheds vernix and lanugo. Meconium (first stool) forms in intestines.", motherTip: "Rest as much as possible. False labour (prodromal) can come and go.", nutrition: "Light, easy-to-digest meals as labour could begin — save energy.", warning: "Green or bloody discharge, severe headache, or vision changes = emergency.", fact: "Emergency preparedness (knowing your hospital, transport, blood donors) saves lives." },
  { week: 39, title: "Final Countdown", babyDev: "Brain and lungs continue maturing. Baby is about 50cm long and 3.3kg.", motherTip: "Emotional preparation: fear and excitement are both normal. You're ready.", nutrition: "Red raspberry leaf tea may help tone uterine muscles (consult your doctor).", warning: "Know the difference: Braxton Hicks are irregular; real labour intensifies.", fact: "Delayed cord clamping for 1-3 minutes increases baby's iron stores by 30%." },
  { week: 40, title: "Due Date!", babyDev: "Baby is fully developed and ready to meet you! Average weight: 3.3-3.6kg.", motherTip: "If labour hasn't started, discuss options with your doctor. Stay positive.", nutrition: "Stay nourished and hydrated — you'll need energy for delivery.", warning: "Post-term pregnancy (42+ weeks) increases risks — discuss induction plan.", fact: "Only 5% of babies are born on their exact due date — normal range is 37-42 weeks." },
];

const TRIMESTERS = [
  { id: "first", label: "1st Trimester", subtitle: "Weeks 1–12", description: "Foundation of life — organs form, heart beats, and your journey begins.", icon: "leaf-outline", image: triImg1.url, range: [1, 12] as [number, number] },
  { id: "second", label: "2nd Trimester", subtitle: "Weeks 13–27", description: "The golden period — baby grows, kicks, and you glow.", icon: "sunny-outline", image: triImg2.url, range: [13, 27] as [number, number] },
  { id: "third", label: "3rd Trimester", subtitle: "Weeks 28–40", description: "The final stretch — baby matures and prepares for arrival.", icon: "moon-outline", image: triImg3.url, range: [28, 40] as [number, number] },
];

const SECTIONS = [
  { key: "babyDev" as const, icon: "happy-outline", label: "Baby's Development", color: "hsl(var(--coral))" },
  { key: "motherTip" as const, icon: "heart-outline", label: "Mum's Tip", color: "hsl(var(--green))" },
  { key: "nutrition" as const, icon: "nutrition-outline", label: "Nutrition", color: "hsl(45 93% 48%)" },
  { key: "warning" as const, icon: "warning-outline", label: "Watch Out", color: "hsl(var(--destructive))" },
  { key: "fact" as const, icon: "stats-chart-outline", label: "Did You Know?", color: "hsl(210 80% 55%)" },
];

const InsightsScreen = ({ onBack }: InsightsScreenProps) => {
  const currentWeek = useAuthStore((s) => s.getCurrentWeek());
  const [selectedTrimester, setSelectedTrimester] = useState<number | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  // Determine which trimester the user is in
  const currentTrimesterIndex = currentWeek <= 13 ? 0 : currentWeek <= 27 ? 1 : 2;

  const handleSelectTrimester = (index: number, focusWeek?: number) => {
    hapticLight();
    setSelectedTrimester(index);
    setExpandedWeek(focusWeek ?? null);
    if (focusWeek) {
      // Wait for the trimester view to mount, then scroll the target week into view.
      setTimeout(() => {
        const el = document.getElementById(`insights-week-${focusWeek}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    }
  };


  const handleBackToCategories = () => {
    hapticLight();
    setSelectedTrimester(null);
    setExpandedWeek(null);
  };

  // Weekly content view
  if (selectedTrimester !== null) {
    const trimester = TRIMESTERS[selectedTrimester];
    const tips = WEEKLY_TIPS.filter((t) => t.week >= trimester.range[0] && t.week <= trimester.range[1]);

    return (
      <motion.div
        className="space-y-5 pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleBackToCategories} className="p-1">
            <IonIcon name="chevron-back-outline" size={24} style={{ color: "hsl(var(--dark))" }} />
          </motion.button>
          <div>
            <h1 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>{trimester.label}</h1>
            <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{trimester.subtitle} • {tips.length} weeks of insights</p>
          </div>
        </div>

        {/* Weekly Tips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-2"
        >
          {tips.map((tip, i) => {
            const isExpanded = expandedWeek === tip.week;
            const isCurrent = tip.week === currentWeek;

            return (
              <motion.div
                key={tip.week}
                id={`insights-week-${tip.week}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }}
                className="tend-card overflow-hidden"
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { hapticLight(); setExpandedWeek(isExpanded ? null : tip.week); }}
                  className="w-full p-4 flex items-center gap-3 text-left"
                >
                  <div
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isCurrent
                        ? "linear-gradient(135deg, hsl(var(--green)), hsl(var(--coral)))"
                        : "hsl(var(--surface))",
                    }}
                  >
                    <span
                      className="text-[13px] font-sans font-bold"
                      style={{ color: isCurrent ? "white" : "hsl(var(--text-muted))" }}
                    >
                      {tip.week}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                        {tip.title}
                      </p>
                      {isCurrent && (
                        <span
                          className="text-[9px] font-sans font-bold uppercase px-2 py-[2px] rounded-full"
                          style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
                        >
                          You're here
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-sans truncate" style={{ color: "hsl(var(--text-muted))" }}>
                      {tip.babyDev}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IonIcon name="chevron-down" size={16} style={{ color: "hsl(var(--text-muted))" }} />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {SECTIONS.map((section) => (
                          <div key={section.key} className="flex gap-3">
                            <div
                              className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: `${section.color}15` }}
                            >
                              <IonIcon name={section.icon} size={16} style={{ color: section.color }} />
                            </div>
                            <div>
                              <p className="text-[11px] font-sans font-semibold uppercase tracking-wider" style={{ color: section.color }}>
                                {section.label}
                              </p>
                              <p className="text-[13px] font-sans mt-0.5 leading-relaxed" style={{ color: "hsl(var(--dark))" }}>
                                {tip[section.key]}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    );
  }

  // Category carousel view
  return (
    <motion.div
      className="space-y-5 pb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Image-backed Hero — Rescue Map style */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-[20px] overflow-hidden"
        style={{ marginTop: 4 }}
      >
        <img src={insightsHero.url} alt="Health Insights" className="w-full h-[200px] object-cover" width={1280} height={768} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, hsla(153,42%,15%,0.85) 0%, hsla(153,42%,20%,0.45) 55%, hsla(0,0%,0%,0.15) 100%)" }} />

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

        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)" }}>
          <span className="text-white text-[11px] font-sans font-semibold tracking-wide">WEEK {currentWeek}</span>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="font-serif text-[26px] text-white leading-tight">Health Insights</h1>
          <p className="text-white/70 text-[12px] font-sans mt-1">
            {WEEKLY_TIPS.find((t) => t.week === currentWeek)?.title || "Week-by-week pregnancy guide"}
          </p>
        </div>
      </motion.div>


      {/* Trimester Carousel Cards */}
      <div>
        <p className="text-[12px] font-sans font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--text-muted))" }}>
          Choose a Trimester
        </p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {TRIMESTERS.map((tri, i) => {
            const isActive = i === currentTrimesterIndex;
            const weeksInTri = WEEKLY_TIPS.filter((t) => t.week >= tri.range[0] && t.week <= tri.range[1]);
            const progressWeeks = isActive ? currentWeek - tri.range[0] + 1 : i < currentTrimesterIndex ? weeksInTri.length : 0;
            const progressPct = Math.round((progressWeeks / weeksInTri.length) * 100);

            return (
              <motion.button
                key={tri.id}
                whileTap={{ scale: 0.96 }}
                whileHover={{ y: -2 }}
                onClick={() => handleSelectTrimester(i)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
                className="flex-shrink-0 relative rounded-[18px] overflow-hidden text-left ios-press"
                style={{
                  width: "200px",
                  aspectRatio: "3/4",
                  boxShadow: isActive
                    ? "0 6px 24px -4px hsla(var(--green) / 0.45), 0 0 0 2px hsl(var(--green))"
                    : "0 4px 20px -4px hsla(0,0%,0%,0.12)",
                }}
              >
                <img
                  src={tri.image}
                  alt={tri.label}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(0deg, hsla(0,0%,0%,0.78) 0%, hsla(0,0%,0%,0.35) 50%, hsla(0,0%,0%,0.1) 100%)",
                  }}
                />

                {/* Icon chip top-left */}
                <div
                  className="absolute top-3 left-3 w-[34px] h-[34px] rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
                >
                  <IonIcon name={tri.icon} size={18} style={{ color: "white" }} />
                </div>

                {/* Current badge top-right */}
                {isActive && (
                  <div
                    className="absolute top-3 right-3 px-2 py-[3px] rounded-full text-[8px] font-sans font-bold uppercase tracking-wide"
                    style={{ background: "hsl(var(--coral))", color: "white" }}
                  >
                    Current
                  </div>
                )}

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <h3 className="text-white text-[16px] font-serif font-bold leading-tight">
                    {tri.label}
                  </h3>
                  <p className="text-white/70 text-[10px] font-sans mt-0.5">
                    {tri.subtitle}
                  </p>
                  <p className="text-white/75 text-[10.5px] font-sans mt-1.5 leading-snug line-clamp-2">
                    {tri.description}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-2.5">
                    <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 + 0.3 }}
                        className="h-full rounded-full"
                        style={{ background: "hsl(var(--coral))" }}
                      />
                    </div>
                    <p className="text-[9px] font-sans font-semibold mt-1 text-white/60">
                      {progressPct}% complete
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Quick peek — current week tip */}
      {(() => {
        const tip = WEEKLY_TIPS.find((t) => t.week === currentWeek);
        if (!tip) return null;
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-[12px] font-sans font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--text-muted))" }}>
              This Week's Highlight
            </p>
            <div className="tend-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-[28px] h-[28px] rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(var(--green)), hsl(var(--coral)))" }}
                >
                  <span className="text-white text-[11px] font-sans font-bold">{tip.week}</span>
                </div>
                <p className="text-[15px] font-serif font-semibold" style={{ color: "hsl(var(--dark))" }}>
                  {tip.title}
                </p>
              </div>
              {[SECTIONS[0], SECTIONS[1]].map((section) => (
                <div key={section.key} className="flex gap-3">
                  <div
                    className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center flex-shrink-0"
                    style={{ background: `${section.color}15` }}
                  >
                    <IonIcon name={section.icon} size={14} style={{ color: section.color }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-sans font-semibold uppercase tracking-wider" style={{ color: section.color }}>
                      {section.label}
                    </p>
                    <p className="text-[12px] font-sans mt-0.5 leading-relaxed" style={{ color: "hsl(var(--dark))" }}>
                      {tip[section.key]}
                    </p>
                  </div>
                </div>
              ))}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectTrimester(currentTrimesterIndex, currentWeek)}
                className="w-full py-2.5 rounded-xl text-[12px] font-sans font-semibold"
                style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
              >
                See all Week {currentWeek} insights →
              </motion.button>
            </div>
          </motion.div>
        );
      })()}
    </motion.div>
  );
};

export default InsightsScreen;

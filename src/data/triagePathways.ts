export type Severity = "green" | "yellow" | "red";

export interface TriageOutcome {
  severity: Severity;
  title: string;
  message: string;
  action: string;
}

export interface TriageOption {
  label: string;
  next?: string;
  outcome?: TriageOutcome;
}

export interface TriageQuestion {
  id: string;
  text: string;
  options: TriageOption[];
}

export interface TriagePathway {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  questions: TriageQuestion[];
}

// ---------- CATEGORY DEFINITIONS ----------
export const CATEGORIES = [
  { id: "fetal", label: "Fetal Wellbeing", icon: "heart-outline" },
  { id: "haemorrhage", label: "Haemorrhage", icon: "water-outline" },
  { id: "hypertensive", label: "Hypertensive", icon: "pulse-outline" },
  { id: "abdominal", label: "Abdominal & GI", icon: "body-outline" },
  { id: "labour", label: "Labour & Birth", icon: "time-outline" },
  { id: "infection", label: "Infection & Sepsis", icon: "bug-outline" },
  { id: "respiratory", label: "Respiratory", icon: "cloud-outline" },
  { id: "cardiac", label: "Cardiac", icon: "heart-circle-outline" },
  { id: "neurological", label: "Neurological", icon: "flash-outline" },
  { id: "liver", label: "Liver & Metabolic", icon: "leaf-outline" },
  { id: "haematological", label: "Haematological", icon: "fitness-outline" },
  { id: "renal", label: "Renal & Urinary", icon: "medical-outline" },
  { id: "early_pregnancy", label: "Early Pregnancy", icon: "flower-outline" },
  { id: "skin", label: "Skin & Dermatology", icon: "bandage-outline" },
  { id: "musculoskeletal", label: "Musculoskeletal", icon: "walk-outline" },
  { id: "postpartum", label: "Postpartum", icon: "rose-outline" },
  { id: "mental_health", label: "Mental Health", icon: "happy-outline" },
];

// ---------- 25 SYMPTOM PATHWAYS ----------
const PATHWAYS: TriagePathway[] = [
  // ===== 01 Reduced or Absent Fetal Movement =====
  {
    id: "reduced_movement",
    name: "Reduced Fetal Movement",
    icon: "fitness-outline",
    description: "Baby moving less than usual",
    category: "fetal",
    questions: [
      {
        id: "rm1",
        text: "How many weeks pregnant are you?",
        options: [
          { label: "Less than 24 weeks", outcome: { severity: "green", title: "Too early for regular counting", message: "Before 24 weeks, fetal movement patterns are not yet established. You may feel flutters intermittently.", action: "Monitor for increasing movement. If you're concerned, mention it at your next antenatal visit." } },
          { label: "24–27 weeks", next: "rm2" },
          { label: "28 weeks or more", next: "rm2" },
        ],
      },
      {
        id: "rm2",
        text: "When did you last feel your baby move?",
        options: [
          { label: "Within the last 2 hours", next: "rm3" },
          { label: "2–6 hours ago", next: "rm4" },
          { label: "More than 6 hours ago or not at all today", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "No fetal movement for 6+ hours after 24 weeks is a clinical emergency. Fetal monitoring (CTG) is required immediately.", action: "Go to the nearest maternity unit now. Tell the nurse: 'My baby has not moved in [X] hours.' Do NOT take herbs or agbo before going." } },
        ],
      },
      {
        id: "rm3",
        text: "Is there any change in the strength or type of movement compared to normal?",
        options: [
          { label: "Movement feels normal, just less frequent", next: "rm4" },
          { label: "Movement feels much weaker than normal", outcome: { severity: "red", title: "Go to a hospital today", message: "Weaker movements — even if the count is adequate — can indicate fetal compromise. Same-day assessment is required.", action: "Go to a hospital today — same day, not tomorrow. Bring your ANC card. Tell the midwife about the change in movement quality." } },
        ],
      },
      {
        id: "rm4",
        text: "Have you had a cold drink, eaten a meal, or lain on your left side in the last 2 hours?",
        options: [
          { label: "Yes, I've tried and the baby is still quiet", next: "rm5" },
          { label: "No, I haven't tried yet", outcome: { severity: "yellow", title: "Try kick counting now", message: "Lie on your left side, drink something cold, and count your baby's movements for 2 hours. A cold drink can stimulate movement.", action: "Count kicks for 2 hours. You should feel at least 10 movements. If fewer than 10, go to hospital immediately." } },
        ],
      },
      {
        id: "rm5",
        text: "How many movements did you count in 2 hours?",
        options: [
          { label: "10 or more", outcome: { severity: "green", title: "Reassuring movement count", message: "Your baby's movement count is reassuring. Continue to monitor daily.", action: "Count kicks every day at the same time, after a meal, lying on your left side. Mention any concerns at your next ANC visit." } },
          { label: "Fewer than 10", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Fewer than 10 movements in 2 hours after focused counting needs urgent assessment. CTG and ultrasound are required.", action: "Go to the nearest maternity unit with CTG equipment immediately. Do not wait until morning." } },
        ],
      },
    ],
  },

  // ===== 02 Vaginal Bleeding =====
  {
    id: "bleeding",
    name: "Vaginal Bleeding",
    icon: "water-outline",
    description: "Vaginal bleeding or spotting",
    category: "haemorrhage",
    questions: [
      {
        id: "vb1",
        text: "How many weeks pregnant are you, or is this after delivery?",
        options: [
          { label: "Less than 20 weeks", next: "vb2" },
          { label: "20 weeks or more", next: "vb2" },
          { label: "After delivery (within 6 weeks)", next: "vb6" },
        ],
      },
      {
        id: "vb2",
        text: "How much blood is there?",
        options: [
          { label: "Light spotting (a few drops)", next: "vb3" },
          { label: "Like a period — using pads", next: "vb4" },
          { label: "Heavy — soaking a pad in under an hour", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Heavy bleeding in pregnancy requires immediate medical evaluation. Do not wait. Take someone with you.", action: "Go to a facility with a blood bank if possible. Do NOT take local herbs or agbo before arriving. Tell the nurse the amount of bleeding." } },
        ],
      },
      {
        id: "vb3",
        text: "Do you have any pain or cramping with the spotting?",
        options: [
          { label: "No pain at all", outcome: { severity: "green", title: "Monitor at home", message: "Light spotting without pain is common, especially in early pregnancy. It may be from cervical changes.", action: "Rest, stay hydrated, avoid intercourse. If bleeding increases or pain develops, contact your doctor immediately." } },
          { label: "Mild cramping", outcome: { severity: "yellow", title: "See your doctor today", message: "Spotting with cramping should be evaluated, though it's often not serious. An ultrasound may be needed.", action: "Call your doctor or midwife today. If you cannot reach one within 2 hours, go to hospital." } },
          { label: "Severe pain", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Spotting with severe pain could indicate ectopic pregnancy or other serious complication.", action: "Go to the nearest emergency room immediately. Do NOT take herbs before being seen." } },
        ],
      },
      {
        id: "vb4",
        text: "What colour is the blood?",
        options: [
          { label: "Dark brown", outcome: { severity: "yellow", title: "See your doctor today", message: "Dark blood is usually older blood. Less immediately urgent but still needs same-day assessment.", action: "Book same-day assessment. Rest until seen. Dark blood cannot be dismissed without examination." } },
          { label: "Bright red", next: "vb5" },
        ],
      },
      {
        id: "vb5",
        text: "Do you feel dizzy, faint, or is your heart racing?",
        options: [
          { label: "No, I feel okay otherwise", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Bright red period-like bleeding needs urgent evaluation. Possible placenta praevia or abruption.", action: "Go to the nearest hospital. Tell the nurse if there is pain or no pain — this changes the diagnosis." } },
          { label: "Yes — I feel dizzy or faint", outcome: { severity: "red", title: "Go to a hospital NOW — URGENT", message: "Bleeding with dizziness or fainting indicates you are losing blood volume. You may need a transfusion.", action: "Hospital immediately. Alert family about your blood type. Nigeria has limited blood supplies — family may need to donate." } },
        ],
      },
      {
        id: "vb6",
        text: "Is the bleeding heavier than your heaviest-ever period, or are there large clots?",
        options: [
          { label: "Yes — very heavy or large clots", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Postpartum haemorrhage is time-critical. Tell the nurse: 'I am bleeding very heavily after birth.'", action: "Hospital immediately. Request IV access and oxytocin. PPH can be fatal within 45 minutes without treatment." } },
          { label: "Moderate — heavier than expected", outcome: { severity: "yellow", title: "See your doctor today", message: "Postpartum bleeding that is increasing rather than decreasing needs evaluation.", action: "Contact your doctor today. Ultrasound may be needed to check for retained products." } },
          { label: "Light — seems normal for after delivery", outcome: { severity: "green", title: "Normal postpartum recovery", message: "Lochia (postpartum discharge) is normal and decreases over 4–6 weeks: red → pink → white/yellow.", action: "Use sanitary pads, rest, take iron supplements. If bleeding suddenly increases or smells bad, seek medical help." } },
        ],
      },
    ],
  },

  // ===== 03 Severe Headache =====
  {
    id: "headache",
    name: "Severe Headache",
    icon: "flash-outline",
    description: "Head pain, pressure, throbbing",
    category: "hypertensive",
    questions: [
      {
        id: "sh1",
        text: "How many weeks pregnant are you?",
        options: [
          { label: "Less than 20 weeks", next: "sh2" },
          { label: "20 weeks or more", next: "sh3" },
        ],
      },
      {
        id: "sh2",
        text: "How would you describe the headache?",
        options: [
          { label: "Mild — I can still do daily activities", outcome: { severity: "green", title: "Monitor at home", message: "Mild headaches before 20 weeks are common. Rest, hydrate, and try a cool cloth on your forehead.", action: "Take paracetamol (NOT ibuprofen — unsafe in pregnancy). Rest, drink water. If not resolved in 4 hours, contact your doctor." } },
          { label: "Severe — worst headache ever", outcome: { severity: "yellow", title: "See your doctor today", message: "A severe headache before 20 weeks is less likely preeclampsia but should still be assessed.", action: "Call your doctor today. If you have any vision changes or cannot be seen, go to hospital." } },
        ],
      },
      {
        id: "sh3",
        text: "On a scale of 1–10, how severe is this headache?",
        options: [
          { label: "Mild to moderate (1–6)", next: "sh4" },
          { label: "Severe (7–10)", next: "sh5" },
        ],
      },
      {
        id: "sh4",
        text: "Do you have any other symptoms alongside the headache?",
        options: [
          { label: "No other symptoms", outcome: { severity: "yellow", title: "See your doctor today", message: "A first-time headache after 20 weeks needs same-day blood pressure check. It could indicate preeclampsia.", action: "Contact your doctor within 2 hours for a BP check. Rest in a darkened room while waiting." } },
          { label: "Mild ankle swelling", outcome: { severity: "yellow", title: "BP check needed today", message: "Headache with swelling needs blood pressure assessment. Reduce salt intake.", action: "See your doctor today. Elevate your feet. Avoid suya and processed foods high in sodium." } },
          { label: "Blurry vision or seeing spots", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Headache with vision changes is a warning sign of preeclampsia, which needs urgent care.", action: "Go to a hospital immediately. Tell the nurse: 'I have a severe headache and my vision is affected.' Magnesium sulphate may be needed." } },
        ],
      },
      {
        id: "sh5",
        text: "Do you also have any of these warning signs?",
        options: [
          { label: "Vision changes or flashing lights", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Severe headache with vision changes is a medical emergency — possible imminent eclampsia.", action: "Go to a hospital immediately. Do NOT take herbs. Magnesium sulphate is the only effective intervention." } },
          { label: "Pain under right ribs", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Headache with right upper abdominal pain may indicate HELLP syndrome — a life-threatening complication.", action: "Hospital urgently. Insist on full blood count and liver function tests. HELLP is often misdiagnosed as gastritis." } },
          { label: "Sudden face or hand swelling", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Headache + sudden swelling = classic preeclampsia. All three symptoms together = hospital immediately.", action: "Go to a hospital now. Do not wait for morning. Do not drive yourself." } },
          { label: "Headache not responding to paracetamol", outcome: { severity: "red", title: "Go to a hospital today", message: "A headache that doesn't respond to paracetamol after 20 weeks is hypertensive until proven otherwise.", action: "Go to a hospital same day. Bring your ANC card. Request blood pressure check on arrival." } },
        ],
      },
    ],
  },

  // ===== 04 Visual Disturbances =====
  {
    id: "visual",
    name: "Visual Disturbances",
    icon: "eye-outline",
    description: "Blurring, flashing lights, spots",
    category: "hypertensive",
    questions: [
      {
        id: "vi1",
        text: "How many weeks pregnant are you?",
        options: [
          { label: "Less than 20 weeks", next: "vi2" },
          { label: "20 weeks or more", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Any visual disturbance after 20 weeks is a red flag for eclampsia — no exceptions. This is a neurological emergency.", action: "Hospital immediately. Tell the nurse: 'I am pregnant and my vision is affected.' Do NOT drive. Call 112. Do NOT take any herb or traditional treatment." } },
        ],
      },
      {
        id: "vi2",
        text: "Describe what you are seeing.",
        options: [
          { label: "Brief blurring when standing up quickly", outcome: { severity: "green", title: "Likely postural hypotension", message: "Brief visual blurring on standing is common in pregnancy — it's caused by blood pressure dropping momentarily.", action: "Sit before standing. Stay hydrated. Take iron supplements if anaemic. Stand up slowly." } },
          { label: "Persistent blurring, spots, or flashing lights", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Persistent visual changes in pregnancy — even before 20 weeks — need same-day assessment.", action: "See your doctor today. If after 20 weeks, go to hospital immediately for BP and eye examination." } },
        ],
      },
    ],
  },

  // ===== 05 Sudden Swelling =====
  {
    id: "swelling",
    name: "Sudden Swelling",
    icon: "hand-left-outline",
    description: "Swollen face, hands, or legs",
    category: "hypertensive",
    questions: [
      {
        id: "sw1",
        text: "Where exactly is the swelling?",
        options: [
          { label: "Feet and ankles (both sides)", next: "sw2" },
          { label: "Hands and/or face", next: "sw3" },
          { label: "One leg only — swollen, warm, or painful", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Swelling in one leg only could indicate a blood clot (DVT), which is a medical emergency.", action: "Hospital immediately. Do NOT massage the leg. Lie still during transport. Anticoagulation treatment is needed." } },
        ],
      },
      {
        id: "sw2",
        text: "Did the swelling come on suddenly or gradually?",
        options: [
          { label: "Gradually over days or weeks", outcome: { severity: "green", title: "Monitor at home", message: "Mild, gradual ankle swelling is very common in pregnancy, especially in the third trimester and hot weather.", action: "Elevate your feet, stay hydrated, reduce salt intake. Avoid standing for long periods. Walk regularly to prevent clots." } },
          { label: "Suddenly — today or yesterday", next: "sw3" },
        ],
      },
      {
        id: "sw3",
        text: "Do you have a headache or vision changes alongside the swelling?",
        options: [
          { label: "Yes — headache and/or blurry vision", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Sudden swelling + headache + vision changes = preeclampsia triad. This is an imminent eclampsia warning.", action: "Go to a hospital immediately. This is urgent. Use the SOS button if needed. Two emergencies are occurring simultaneously." } },
          { label: "No other symptoms", outcome: { severity: "yellow", title: "See your doctor today", message: "Sudden swelling in the hands or face should be evaluated by your doctor today for blood pressure and urine protein.", action: "Contact your doctor today. If no doctor reachable within 2 hours, go to hospital." } },
        ],
      },
    ],
  },

  // ===== 06 Abdominal Pain =====
  {
    id: "abdominal_pain",
    name: "Abdominal Pain",
    icon: "body-outline",
    description: "Stomach or lower belly pain",
    category: "abdominal",
    questions: [
      {
        id: "ap1",
        text: "Where is the pain?",
        options: [
          { label: "Lower belly, both sides", next: "ap2" },
          { label: "One side only", next: "ap3" },
          { label: "Upper belly, under ribs", outcome: { severity: "yellow", title: "See your doctor today", message: "Upper abdominal pain, especially on the right side, can indicate liver issues, gallbladder problems, or HELLP syndrome.", action: "Call your doctor today. If pain is severe or you have headache or visual changes, go to hospital immediately." } },
        ],
      },
      {
        id: "ap2",
        text: "How would you describe the pain?",
        options: [
          { label: "Mild stretching or pulling feeling", outcome: { severity: "green", title: "Monitor at home", message: "Round ligament pain and stretching sensations are normal as your uterus grows.", action: "Rest, use a warm (not hot) compress, and change positions slowly. If pain worsens, contact your doctor." } },
          { label: "Coming and going like contractions", next: "ap4" },
          { label: "Constant and getting worse", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Constant worsening abdominal pain needs immediate evaluation. Could indicate abruption or uterine rupture.", action: "Go to a hospital immediately. If you have had a previous caesarean section, this is especially urgent." } },
        ],
      },
      {
        id: "ap3",
        text: "How severe is the one-sided pain?",
        options: [
          { label: "Mild — comes and goes", outcome: { severity: "yellow", title: "See your doctor today", message: "One-sided pain should be evaluated, especially in early pregnancy, to rule out ectopic pregnancy.", action: "Call your doctor today to arrange an assessment. If pain becomes severe, go to hospital." } },
          { label: "Sharp and severe", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Severe one-sided pain could indicate an ectopic pregnancy or ovarian emergency.", action: "Go to the nearest emergency room immediately. Do not delay." } },
        ],
      },
      {
        id: "ap4",
        text: "How many weeks pregnant are you?",
        options: [
          { label: "Less than 37 weeks", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Contraction-like pain before 37 weeks could indicate preterm labour. Tocolysis may be needed.", action: "Go to a hospital immediately. Time the contractions if you can. Do NOT take herbs." } },
          { label: "37 weeks or more", outcome: { severity: "yellow", title: "Contact your doctor", message: "You may be in early labour. Time your contractions and monitor their pattern.", action: "Call your hospital. Go in if contractions are 5 minutes apart and lasting 1 minute for 1 hour." } },
        ],
      },
    ],
  },

  // ===== 07 Contractions / Labour Signs =====
  {
    id: "contractions",
    name: "Contractions / Labour Signs",
    icon: "timer-outline",
    description: "Tightening, regular pains",
    category: "labour",
    questions: [
      {
        id: "cl1",
        text: "How many weeks pregnant are you?",
        options: [
          { label: "Less than 37 weeks", next: "cl2" },
          { label: "37 weeks or more", next: "cl3" },
        ],
      },
      {
        id: "cl2",
        text: "Are the contractions regular and getting stronger?",
        options: [
          { label: "Yes — regular and intensifying", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Regular contractions before 37 weeks = possible preterm labour. Steroids and tocolysis may be needed.", action: "Hospital immediately. Tell nurse your gestation and contraction frequency. Do NOT take herbs." } },
          { label: "Irregular and mild", outcome: { severity: "yellow", title: "Monitor closely", message: "Irregular mild tightenings before 37 weeks may be Braxton Hicks, but need monitoring.", action: "Rest, hydrate well. If they become regular or painful, or your waters break, go to hospital immediately." } },
        ],
      },
      {
        id: "cl3",
        text: "How often are contractions coming, and how long does each one last?",
        options: [
          { label: "5 minutes apart, lasting 1 minute each", outcome: { severity: "yellow", title: "Go to a hospital", message: "You are likely in active labour (5-1-1 rule). Time to go to hospital.", action: "Call your hospital and head in. If you have given birth before, go sooner — multigravida women dilate faster." } },
          { label: "More than 10 minutes apart, mild", outcome: { severity: "green", title: "Early labour — monitor", message: "This sounds like early (latent) labour. Stay home, walk around, eat lightly.", action: "Go to a hospital when contractions are 5 minutes apart or your waters break. Stay hydrated." } },
          { label: "I feel the urge to push or bear down", outcome: { severity: "red", title: "EMERGENCY — imminent birth", message: "The urge to push means your baby may come very soon. This is a birth emergency.", action: "Call 112. If you cannot get to hospital, prepare for delivery. Do NOT try to hold the baby in." } },
        ],
      },
    ],
  },

  // ===== 08 Waters Breaking =====
  {
    id: "waters_breaking",
    name: "Waters Breaking",
    icon: "rainy-outline",
    description: "Fluid leaking from vagina",
    category: "labour",
    questions: [
      {
        id: "wb1",
        text: "What colour is the fluid?",
        options: [
          { label: "Clear or slightly pink", next: "wb2" },
          { label: "Green, brown, or yellow", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Green or brown fluid = meconium staining, which indicates fetal distress. Continuous monitoring required.", action: "Hospital immediately. Tell the nurse: 'The fluid is green/brown.' Do NOT delay for any reason." } },
        ],
      },
      {
        id: "wb2",
        text: "How many weeks pregnant are you?",
        options: [
          { label: "Less than 34 weeks", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Preterm rupture of membranes requires urgent assessment. Steroids and antibiotics may be needed.", action: "Hospital immediately. Neonatal preparation is required. Wear a clean pad and note the time your waters broke." } },
          { label: "34–36 weeks", outcome: { severity: "yellow", title: "Go to a hospital within 2 hours", message: "Ruptured membranes at this stage need assessment and a management plan.", action: "Go to a hospital within 2 hours. No vaginal examination before ultrasound. Note time of rupture." } },
          { label: "37 weeks or more", next: "wb3" },
        ],
      },
      {
        id: "wb3",
        text: "Do you have a fever or does the fluid smell bad?",
        options: [
          { label: "No fever, fluid smells normal", outcome: { severity: "yellow", title: "Go to a hospital within 4 hours", message: "Term rupture without signs of infection. Labour usually starts within 24 hours.", action: "Hospital within 4 hours. Use a clean pad (not tampon). No intercourse. Nothing vaginally." } },
          { label: "Yes — fever or bad smell", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Ruptured membranes with fever = possible chorioamnionitis. IV antibiotics are urgently needed.", action: "Hospital immediately. Risk of sepsis is very high without treatment. Tell nurse about the fever and discharge." } },
        ],
      },
    ],
  },

  // ===== 09 Fever =====
  {
    id: "fever",
    name: "Fever / High Temperature",
    icon: "thermometer-outline",
    description: "High temperature, chills, rigors",
    category: "infection",
    questions: [
      {
        id: "fe1",
        text: "How many weeks pregnant are you, or is this after delivery?",
        options: [
          { label: "Currently pregnant", next: "fe2" },
          { label: "Within 10 days of delivery", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Post-delivery fever within 10 days = puerperal sepsis until proven otherwise. IV antibiotics are urgently required.", action: "Hospital immediately. Tell the nurse: 'I gave birth [X] days ago and have a high fever.' Request blood culture before antibiotics." } },
        ],
      },
      {
        id: "fe2",
        text: "What is your temperature?",
        options: [
          { label: "Slightly warm (37.5–38°C)", next: "fe3" },
          { label: "High (above 38°C)", next: "fe4" },
          { label: "I haven't checked but feel very hot/cold", next: "fe3" },
        ],
      },
      {
        id: "fe3",
        text: "Do you have any other symptoms?",
        options: [
          { label: "Runny nose or mild cough", outcome: { severity: "green", title: "Monitor at home", message: "You likely have a mild viral infection. Rest and stay hydrated. Always get a malaria test if in Nigeria.", action: "Rest, drink fluids, take paracetamol (NOT ibuprofen). See your doctor if fever lasts more than 48 hours. Test for malaria." } },
          { label: "Pain when urinating", outcome: { severity: "yellow", title: "See your doctor today", message: "Fever with urinary symptoms could indicate a UTI or kidney infection, which needs antibiotics in pregnancy.", action: "Call your doctor today for a urine test and possible antibiotics." } },
          { label: "Abdominal pain or offensive discharge", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Fever with abdominal pain or foul discharge = possible chorioamnionitis or sepsis. Extremely dangerous.", action: "Hospital immediately. IV antibiotics are urgently needed. Do NOT delay." } },
        ],
      },
      {
        id: "fe4",
        text: "Do you have chills, rigors (uncontrolled shaking), or feel very cold?",
        options: [
          { label: "Yes — shaking chills or rigors", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "High fever with rigors in pregnancy could indicate malaria, severe infection, or sepsis.", action: "Hospital immediately. Request rapid malaria test on arrival. In Nigeria, assume malaria until proven otherwise." } },
          { label: "No rigors — just feeling very hot", outcome: { severity: "yellow", title: "See your doctor today", message: "A high fever in pregnancy should be evaluated promptly. Take paracetamol to bring it down.", action: "Take paracetamol. Call your doctor today. Get a malaria test. If fever persists more than 24 hours, go to hospital." } },
        ],
      },
    ],
  },

  // ===== 10 Signs of Sepsis =====
  {
    id: "sepsis",
    name: "Feeling Very Unwell / Sepsis",
    icon: "alert-circle-outline",
    description: "Confused, racing heart, fast breathing",
    category: "infection",
    questions: [
      {
        id: "se1",
        text: "Are you feeling confused, drowsy, or not thinking clearly?",
        options: [
          { label: "Yes — confused or very drowsy", outcome: { severity: "red", title: "Go to a hospital NOW — URGENT", message: "Confusion + fever + fast breathing = septic shock. ICU-level care may be needed.", action: "Call 112 immediately. Lie flat. Keep warm. IV access, blood cultures, and antibiotics are needed within 1 hour." } },
          { label: "No — alert but feel very unwell", next: "se2" },
        ],
      },
      {
        id: "se2",
        text: "Do you have two or more of these: fever, racing heart, fast breathing, not passing much urine?",
        options: [
          { label: "Yes — two or more of these", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Two or more sepsis warning signs = sepsis criteria met. IV antibiotics are needed within 1 hour.", action: "Hospital immediately. Request sepsis bundle: blood cultures, IV antibiotics, IV fluids, oxygen. Ask for a senior doctor." } },
          { label: "Only one symptom", outcome: { severity: "yellow", title: "Go to a hospital within 2 hours", message: "A single warning sign with feeling unwell needs prompt assessment.", action: "Hospital within 2 hours. Report: 'I have a fever and feel very unwell.' Request blood tests (WBC and CRP)." } },
        ],
      },
    ],
  },

  // ===== 11 Breathlessness =====
  {
    id: "breathlessness",
    name: "Breathlessness",
    icon: "cloud-outline",
    description: "Difficulty breathing, short of breath",
    category: "respiratory",
    questions: [
      {
        id: "br1",
        text: "Did the breathlessness come on suddenly or gradually?",
        options: [
          { label: "Suddenly — with no warning", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Sudden breathlessness in pregnancy = pulmonary embolism or amniotic fluid embolism until proven otherwise.", action: "Hospital immediately. Lie on your left side. Call 112. Do not delay for any reason." } },
          { label: "Gradually getting worse over days/weeks", next: "br2" },
          { label: "Only when walking or on exertion", next: "br3" },
        ],
      },
      {
        id: "br2",
        text: "Do you have any of these alongside the breathlessness?",
        options: [
          { label: "Chest pain or recent leg swelling", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Breathlessness + chest pain + leg swelling = high probability of pulmonary embolism.", action: "Hospital immediately. Do NOT massage the leg. Lie flat during transport. Request D-dimer and CT-PA scan." } },
          { label: "Very pale gums or fingernails", outcome: { severity: "red", title: "Go to a hospital today", message: "Breathlessness with pallor suggests severe anaemia (Hb likely below 7). Blood transfusion may be needed.", action: "Hospital same day. Request full blood count. Blood transfusion may be required." } },
          { label: "Ankle swelling, worse when lying flat", outcome: { severity: "yellow", title: "Assessment needed urgently", message: "These signs could indicate peripartum cardiomyopathy, which is more common in Nigerian women.", action: "Assessment within 24 hours. Echocardiogram is needed to check heart function." } },
        ],
      },
      {
        id: "br3",
        text: "How many weeks pregnant are you?",
        options: [
          { label: "28–36 weeks", outcome: { severity: "green", title: "Likely normal pregnancy change", message: "Mild breathlessness on exertion in late pregnancy is normal — your growing baby pushes up on your diaphragm.", action: "Rest when breathless. Walk slowly. Sit upright. If breathlessness occurs at rest or lying flat, see your doctor urgently." } },
          { label: "After delivery (within 5 months)", outcome: { severity: "yellow", title: "Assessment needed", message: "New breathlessness after delivery could indicate peripartum cardiomyopathy — especially if worse when lying flat.", action: "See your doctor within 24 hours for an echocardiogram. This condition is treatable but must not be missed." } },
        ],
      },
    ],
  },

  // ===== 12 Chest Pain / Palpitations =====
  {
    id: "chest_pain",
    name: "Chest Pain / Palpitations",
    icon: "heart-circle-outline",
    description: "Chest pain, racing or irregular heart",
    category: "cardiac",
    questions: [
      {
        id: "cp1",
        text: "Describe the chest pain or sensation.",
        options: [
          { label: "Sharp pain, worse when breathing in", next: "cp2" },
          { label: "Heart racing, skipping, or fluttering", next: "cp3" },
          { label: "Crushing pressure or tightness", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Crushing chest pain is rare in pregnancy but life-threatening. Cardiac event must be excluded.", action: "Hospital immediately. Request ECG and troponin. Ask for cardiology and obstetrics jointly." } },
          { label: "Burning sensation, worse after eating", outcome: { severity: "yellow", title: "Likely heartburn (GORD)", message: "Acid reflux is very common in pregnancy and feels like chest burning.", action: "Avoid spicy food, pepper soup, and suya. Eat small frequent meals. Sleep propped up. See doctor if not improving." } },
        ],
      },
      {
        id: "cp2",
        text: "Do you have any recent leg swelling or calf pain?",
        options: [
          { label: "Yes — one leg swollen or painful", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Sharp chest pain + leg swelling = possible pulmonary embolism. This is an emergency.", action: "Hospital immediately. Do NOT massage the leg. Lie flat during transport. IV heparin may be needed." } },
          { label: "No leg symptoms", outcome: { severity: "yellow", title: "Assessment needed today", message: "Sharp pleuritic chest pain needs same-day evaluation to exclude PE and pneumonia.", action: "See your doctor today. Request chest X-ray and D-dimer if available." } },
        ],
      },
      {
        id: "cp3",
        text: "Have you fainted or nearly fainted with the palpitations?",
        options: [
          { label: "Yes — fainted or nearly fainted", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Palpitations with fainting = haemodynamically significant arrhythmia. ECG is required urgently.", action: "Hospital immediately. Do not drive yourself. Request ECG while in emergency." } },
          { label: "No fainting — just aware of heart racing", outcome: { severity: "yellow", title: "Assessment within 24 hours", message: "New palpitations in pregnancy should be assessed. Most common cause in Nigeria is anaemia.", action: "Request FBC to check for anaemia and thyroid function test. Avoid caffeine and energy drinks." } },
        ],
      },
    ],
  },

  // ===== 13 Severe Vomiting =====
  {
    id: "vomiting",
    name: "Severe Vomiting",
    icon: "medical-outline",
    description: "Excessive vomiting, can't keep fluids down",
    category: "abdominal",
    questions: [
      {
        id: "sv1",
        text: "How many times have you vomited today?",
        options: [
          { label: "1–3 times", next: "sv2" },
          { label: "4–9 times", next: "sv3" },
          { label: "10 or more times", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Vomiting 10+ times per day = severe hyperemesis gravidarum requiring hospital admission and IV fluids.", action: "Hospital immediately. You need IV fluids and anti-emetic medication. Request IV thiamine (Vitamin B1) BEFORE any IV dextrose." } },
        ],
      },
      {
        id: "sv2",
        text: "Can you keep any fluids down?",
        options: [
          { label: "Yes — I can sip water", outcome: { severity: "green", title: "Monitor at home", message: "Morning sickness is unpleasant but manageable if you can stay hydrated. It usually improves by week 14–16.", action: "Eat small frequent meals. Ginger tea may help. Drink plenty of water. See your doctor if worsening." } },
          { label: "No — everything comes back up", next: "sv3" },
        ],
      },
      {
        id: "sv3",
        text: "Have you been able to keep any fluids down in the last 24 hours?",
        options: [
          { label: "No fluids kept down for 24+ hours", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "No fluids for 24 hours = significant dehydration. IV fluids are urgently needed. You may need admission.", action: "Hospital immediately. Request IV fluids and thiamine. Do not accept IV dextrose without thiamine first." } },
          { label: "Some fluids staying down", outcome: { severity: "yellow", title: "See your doctor today", message: "Persistent vomiting with difficulty keeping fluids needs same-day assessment.", action: "Call your doctor today. Anti-emetic medication may be needed. Rest and try small sips of water frequently." } },
        ],
      },
    ],
  },

  // ===== 14 Dizziness / Fainting =====
  {
    id: "dizziness",
    name: "Dizziness / Fainting",
    icon: "sync-outline",
    description: "Feeling faint, dizzy, or collapsed",
    category: "neurological",
    questions: [
      {
        id: "dz1",
        text: "Did you actually faint (lose consciousness) or just feel dizzy?",
        options: [
          { label: "Actually fainted — lost consciousness", next: "dz2" },
          { label: "Felt dizzy but didn't faint", next: "dz3" },
        ],
      },
      {
        id: "dz2",
        text: "Is there any vaginal bleeding or abdominal pain alongside?",
        options: [
          { label: "Yes — bleeding or pain", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Fainting with bleeding = possible haemorrhagic shock or ruptured ectopic pregnancy. This is life-threatening.", action: "Hospital immediately. Lie flat. Call 112. IV access is needed urgently." } },
          { label: "No bleeding or pain", outcome: { severity: "yellow", title: "See your doctor today", message: "Fainting without obvious cause in pregnancy needs same-day assessment to exclude serious causes.", action: "Do not drive. See your doctor today. Eat and drink something sweet. Request blood pressure and blood sugar check." } },
        ],
      },
      {
        id: "dz3",
        text: "When does the dizziness happen?",
        options: [
          { label: "Only when standing up quickly", outcome: { severity: "green", title: "Likely postural hypotension", message: "Positional dizziness is very common in pregnancy due to blood pressure changes.", action: "Stand up slowly. Sit on the edge of the bed before standing. Stay hydrated. Take iron if anaemic." } },
          { label: "At rest or lying down", outcome: { severity: "yellow", title: "See your doctor today", message: "Dizziness at rest is more concerning and may indicate anaemia, low blood sugar, or another cause.", action: "See your doctor today. Check haemoglobin and blood sugar. When did you last eat? Eat something now." } },
          { label: "With shoulder tip pain (early pregnancy)", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Dizziness + shoulder tip pain in early pregnancy = ruptured ectopic pregnancy until proven otherwise.", action: "Hospital immediately. This is a surgical emergency. Call 112." } },
        ],
      },
    ],
  },

  // ===== 15 Seizures / Fits =====
  {
    id: "seizures",
    name: "Seizures / Fits",
    icon: "thunderstorm-outline",
    description: "Seizure, convulsion, or fit",
    category: "neurological",
    questions: [
      {
        id: "sz1",
        text: "Is the seizure happening right now?",
        options: [
          { label: "Yes — currently having a seizure", outcome: { severity: "red", title: "CALL 112 NOW", message: "Active seizure in pregnancy = eclampsia. Do NOT restrain. Keep airway open. Recovery position after seizure.", action: "Call 112 immediately. Do NOT put anything in her mouth. Time the seizure. Magnesium sulphate is needed urgently." } },
          { label: "No — seizure has stopped", next: "sz2" },
          { label: "No seizure yet — severe headache + visual changes", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Severe headache + visual changes = impending eclampsia. MgSO4 prophylaxis is needed before the seizure happens.", action: "Hospital immediately. This is the window to prevent the seizure. Magnesium sulphate is the only effective prevention." } },
        ],
      },
      {
        id: "sz2",
        text: "How long ago did the seizure happen?",
        options: [
          { label: "Within the last hour", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Recent seizure = eclampsia until proven otherwise. Magnesium sulphate treatment is urgently required.", action: "Hospital immediately. Tell the nurse: 'She had a seizure [X] minutes ago and is pregnant.' MgSO4 must be given." } },
          { label: "More than 1 hour ago, now seems okay", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Any seizure in pregnancy or within 6 weeks of delivery = hospital immediately, even if she seems fine now.", action: "Hospital now — eclampsia can recur. Even if she has known epilepsy, eclampsia must be excluded." } },
        ],
      },
    ],
  },

  // ===== 16 Severe Itching (No Rash) =====
  {
    id: "itching",
    name: "Severe Itching (No Rash)",
    icon: "hand-right-outline",
    description: "Intense itching, especially palms and soles",
    category: "liver",
    questions: [
      {
        id: "it1",
        text: "Where is the itching — especially on palms of hands and soles of feet?",
        options: [
          { label: "Yes — palms and/or soles specifically", next: "it2" },
          { label: "All over body, not specifically palms/soles", next: "it3" },
        ],
      },
      {
        id: "it2",
        text: "Is the itching worse at night?",
        options: [
          { label: "Yes — much worse at night", outcome: { severity: "yellow", title: "See your doctor TODAY — urgent", message: "Itching on palms and soles that worsens at night is the hallmark of obstetric cholestasis (ICP). Bile acid blood test is required.", action: "Call your doctor today. Request bile acid blood test. Bile acids > 40 μmol/L = high risk. ICP can cause sudden stillbirth if untreated." } },
          { label: "No — same throughout the day", outcome: { severity: "yellow", title: "See your doctor today", message: "Palmoplantar itching without nocturnal pattern still needs assessment for cholestasis.", action: "See your doctor today for bile acid measurement and liver function tests." } },
        ],
      },
      {
        id: "it3",
        text: "Do you have any yellowing of eyes or skin, or dark urine?",
        options: [
          { label: "Yes — yellow eyes or dark urine", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Jaundice with itching = severe liver involvement. All jaundice in pregnancy is potentially life-threatening.", action: "Hospital immediately. Request liver function tests urgently. Never reassure without LFTs." } },
          { label: "No — just itching, no colour changes", outcome: { severity: "yellow", title: "See your doctor this week", message: "Generalised itching may be due to skin stretching, dermatitis, or mild cholestasis.", action: "See your doctor for blood tests. Avoid hot baths. Use calamine lotion for relief." } },
        ],
      },
    ],
  },

  // ===== 17 Jaundice =====
  {
    id: "jaundice",
    name: "Jaundice (Yellow Eyes/Skin)",
    icon: "contrast-outline",
    description: "Yellowing of eyes or skin",
    category: "liver",
    questions: [
      {
        id: "ja1",
        text: "Do you notice yellow colour in your eyes or skin?",
        options: [
          { label: "Yes — yellow eyes or skin", next: "ja2" },
          { label: "Others have noticed — I'm not sure", next: "ja2" },
        ],
      },
      {
        id: "ja2",
        text: "Do you have any of these alongside the jaundice?",
        options: [
          { label: "Confusion or feeling very drowsy", outcome: { severity: "red", title: "Go to a hospital NOW — URGENT", message: "Jaundice + confusion = hepatic failure. ICU-level care may be needed. Delivery may be required to save the mother.", action: "Call 112. Hepatic encephalopathy has high mortality in pregnancy." } },
          { label: "Abdominal pain and/or fever", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Jaundice + pain + fever = possible Hepatitis E or acute fatty liver of pregnancy.", action: "Hospital immediately. Hepatitis E carries 25% maternal mortality in pregnancy. Supportive care + delivery is the treatment." } },
          { label: "Severe pain with sickle cell disease", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Sickle cell crisis with jaundice = acute haemolytic crisis. Exchange transfusion may be needed.", action: "Hospital immediately. Request haematology team. High-risk pathway." } },
          { label: "No other symptoms — just yellow colour", outcome: { severity: "red", title: "Go to a hospital TODAY", message: "All jaundice in pregnancy requires same-day assessment. Every cause is potentially life-threatening.", action: "Hospital today. Request LFTs, FBC, and viral hepatitis screen. Do not wait." } },
        ],
      },
    ],
  },

  // ===== 18 Painful / Swollen Single Leg (DVT) =====
  {
    id: "dvt",
    name: "Painful / Swollen Leg (DVT)",
    icon: "footsteps-outline",
    description: "One leg swollen, warm, red, or painful",
    category: "haematological",
    questions: [
      {
        id: "dv1",
        text: "Is the swelling in one leg or both?",
        options: [
          { label: "One leg only", next: "dv2" },
          { label: "Both legs equally", outcome: { severity: "green", title: "Likely pregnancy oedema", message: "Bilateral mild ankle swelling without pain or redness is common in pregnancy.", action: "Rest, elevate feet, reduce salt. Walk regularly — immobility increases clot risk. Compression socks are available in pharmacies." } },
        ],
      },
      {
        id: "dv2",
        text: "Is the swollen leg warm, red, or tender to touch?",
        options: [
          { label: "Yes — warm, red, or tender", next: "dv3" },
          { label: "Just mildly swollen, no warmth or redness", outcome: { severity: "yellow", title: "Assessment within 4 hours", message: "One leg more swollen than the other needs same-day assessment. Doppler ultrasound is required.", action: "Do not delay — DVT can progress to pulmonary embolism within hours. Request leg Doppler on arrival." } },
        ],
      },
      {
        id: "dv3",
        text: "Do you have any breathlessness or chest pain alongside the leg symptoms?",
        options: [
          { label: "Yes — breathless or chest pain", outcome: { severity: "red", title: "Go to a hospital NOW — URGENT", message: "DVT + breathlessness = probable pulmonary embolism. This is a medical emergency.", action: "Hospital immediately. Do NOT massage the leg. Lie still during transport. Emergency anticoagulation is needed." } },
          { label: "No — just the leg symptoms", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Classic DVT signs (one leg: swollen, red, warm, tender) require urgent anticoagulation.", action: "Hospital immediately. LMWH (low-molecular-weight heparin) is safe in pregnancy. Request Doppler ultrasound." } },
        ],
      },
    ],
  },

  // ===== 19 Urinary Symptoms =====
  {
    id: "urinary",
    name: "Urinary Symptoms",
    icon: "water-outline",
    description: "Burning urine, cloudy urine, reduced output",
    category: "renal",
    questions: [
      {
        id: "ur1",
        text: "What urinary symptoms are you experiencing?",
        options: [
          { label: "Burning or pain when urinating", next: "ur2" },
          { label: "Very reduced urine output", next: "ur3" },
          { label: "Just going more frequently — no pain", outcome: { severity: "green", title: "Normal in pregnancy", message: "Increased urinary frequency without burning, fever, or cloudy urine is normal — your growing uterus presses on your bladder.", action: "Keep drinking plenty of water. Void when you feel the urge — do not hold it. Kegel exercises can help." } },
        ],
      },
      {
        id: "ur2",
        text: "Do you have a fever or back/flank pain alongside?",
        options: [
          { label: "Yes — fever and/or back pain", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "UTI symptoms + fever + back pain = pyelonephritis (kidney infection). IV antibiotics and IV fluids are required.", action: "Hospital immediately. Tell the nurse: 'I have a kidney infection while pregnant.' Urine culture before antibiotics." } },
          { label: "No fever — just burning and cloudy urine", outcome: { severity: "yellow", title: "See your doctor today", message: "Lower UTI in pregnancy needs prompt treatment. Untreated UTI progresses to kidney infection in 30–40% of cases.", action: "See your doctor today for urine dipstick and culture. Safe antibiotics: nitrofurantoin (not at term), amoxicillin, cefalexin." } },
        ],
      },
      {
        id: "ur3",
        text: "How long has your urine output been reduced?",
        options: [
          { label: "Less than 8 hours", outcome: { severity: "yellow", title: "Drink fluids and monitor", message: "You may be dehydrated. Drink plenty of water and monitor. If output doesn't improve, see your doctor.", action: "Drink water immediately. If no improvement in 4 hours, contact your doctor for BP and kidney function check." } },
          { label: "No urine for 8+ hours", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "No urine for 8+ hours in pregnancy = possible acute kidney injury. This can develop rapidly.", action: "Hospital immediately. Catheterisation and renal monitoring are required. Request blood creatinine and urea. BP check immediately." } },
        ],
      },
    ],
  },

  // ===== 20 Anaemia Symptoms =====
  {
    id: "anaemia",
    name: "Anaemia Symptoms",
    icon: "color-palette-outline",
    description: "Extreme tiredness, pallor, breathlessness",
    category: "haematological",
    questions: [
      {
        id: "an1",
        text: "Are your inner eyelids, gums, or fingernail beds very pale?",
        options: [
          { label: "Yes — noticeably pale", next: "an2" },
          { label: "Not sure — but very tired", next: "an3" },
        ],
      },
      {
        id: "an2",
        text: "Are you short of breath when walking or doing light activity?",
        options: [
          { label: "Yes — breathless at rest or minimal exertion", outcome: { severity: "red", title: "Go to a hospital today", message: "Pale + breathless at rest = likely severe anaemia (Hb below 7). Blood transfusion may be urgently needed.", action: "Hospital same day. Request full blood count. Family member may need to donate blood — Nigeria has limited supply." } },
          { label: "Mild breathlessness on exertion only", outcome: { severity: "yellow", title: "See your doctor this week", message: "Moderate anaemia needs treatment with iron and folic acid. A blood test will confirm the level.", action: "See your doctor for FBC. Iron-rich foods: liver, dark leafy vegetables (ofe onugbu). Vitamin C enhances iron absorption. Avoid tea with meals." } },
        ],
      },
      {
        id: "an3",
        text: "Do you have sickle cell disease?",
        options: [
          { label: "Yes — and having severe pain now", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Sickle cell crisis in pregnancy = high-risk emergency. Multi-disciplinary care is needed.", action: "Hospital immediately. Request haematology team. IV fluids, oxygen, analgesia, and blood transfusion may be needed." } },
          { label: "No sickle cell — just very tired", outcome: { severity: "green", title: "Continue supplements", message: "Mild tiredness with iron supplements being taken is common. Continue your supplements and eat well.", action: "Continue iron and folic acid. FBC at your next ANC visit. Iron supplements cause dark stools — this is normal." } },
        ],
      },
    ],
  },

  // ===== 21 Early Pregnancy Bleeding / Pain =====
  {
    id: "early_pregnancy",
    name: "Early Pregnancy Pain/Bleeding",
    icon: "flower-outline",
    description: "Bleeding or pain before 20 weeks",
    category: "early_pregnancy",
    questions: [
      {
        id: "ep1",
        text: "Do you have any pain alongside the bleeding?",
        options: [
          { label: "One-sided abdominal pain", next: "ep2" },
          { label: "Central cramping pain", next: "ep3" },
          { label: "No pain — just bleeding", next: "ep3" },
        ],
      },
      {
        id: "ep2",
        text: "Do you have any shoulder tip pain or feeling dizzy/faint?",
        options: [
          { label: "Yes — shoulder pain or dizziness", outcome: { severity: "red", title: "Go to a hospital NOW — URGENT", message: "One-sided pain + shoulder tip pain + dizziness = ruptured ectopic pregnancy until proven otherwise. This is a surgical emergency.", action: "Hospital immediately. Call 112. Tell nurse: 'I am pregnant and have severe abdominal and shoulder pain.' Surgery may be within the hour." } },
          { label: "No — just one-sided pain", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "One-sided pain in early pregnancy must exclude ectopic pregnancy. Same-day ultrasound is required.", action: "Hospital same day. Ectopic pregnancy is the leading cause of first-trimester maternal death in Nigeria." } },
        ],
      },
      {
        id: "ep3",
        text: "How heavy is the bleeding?",
        options: [
          { label: "Very heavy — soaking pads", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Heavy bleeding in early pregnancy requires urgent assessment. Surgical evacuation may be needed.", action: "Hospital immediately. Blood transfusion may be needed if haemodynamically compromised." } },
          { label: "Light to moderate bleeding with cramping", outcome: { severity: "yellow", title: "Assessment within 24 hours", message: "This could be a threatened miscarriage. Ultrasound and hCG levels will assess viability.", action: "See your doctor within 24 hours. Rest, avoid intercourse. Do not insert tampons." } },
          { label: "Very light spotting, no pain", outcome: { severity: "green", title: "Monitor at home", message: "Light spotting in early pregnancy is common and may be from cervical changes. Usually benign.", action: "Rest, avoid intercourse. If bleeding increases or pain develops, see your doctor. Mention at your next ANC visit." } },
        ],
      },
    ],
  },

  // ===== 22 Skin Rash =====
  {
    id: "skin_rash",
    name: "Skin Rash or Changes",
    icon: "bandage-outline",
    description: "Rash, blisters, or skin changes",
    category: "skin",
    questions: [
      {
        id: "sr1",
        text: "Describe the rash — what does it look like?",
        options: [
          { label: "Blisters (fluid-filled) on body/face", next: "sr2" },
          { label: "Itchy raised bumps on abdomen/thighs", next: "sr3" },
          { label: "Widespread rash with high fever", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "New widespread rash + high fever = possible chickenpox, measles, or severe viral illness in pregnancy.", action: "Hospital same day. Request LFTs, FBC, and viral screen. Chickenpox pneumonia risk is 10–20% in pregnant adults." } },
        ],
      },
      {
        id: "sr2",
        text: "Have you been in contact with anyone who has chickenpox recently?",
        options: [
          { label: "Yes — or unsure of my immunity", outcome: { severity: "yellow", title: "See your doctor TODAY", message: "Chickenpox exposure in pregnancy is serious. Immunoglobulin (VZIG) may be needed within 96 hours of exposure.", action: "Contact your doctor immediately. If VZIG is not available, aciclovir may be given. Do not delay." } },
          { label: "No contact — rash appeared on its own", outcome: { severity: "yellow", title: "See your doctor today", message: "Blistering rash in pregnancy needs assessment to determine the cause and appropriate treatment.", action: "See your doctor today. If fever develops, go to hospital. Aciclovir must start within 24 hours for chickenpox." } },
        ],
      },
      {
        id: "sr3",
        text: "Is there any fever alongside the itchy bumps?",
        options: [
          { label: "No fever — just itchy", outcome: { severity: "green", title: "Likely PUPPP — monitor", message: "PUPPP (itchy pregnancy rash on abdomen) is benign but miserable. It resolves after delivery.", action: "Calamine lotion, cool baths, emollient cream. Loose cotton clothing. Avoid heat. See doctor if it spreads rapidly." } },
          { label: "Yes — fever as well", outcome: { severity: "yellow", title: "See your doctor today", message: "Itchy rash with fever needs evaluation to exclude viral causes like chickenpox.", action: "See your doctor today for assessment. If blisters develop, this becomes more urgent." } },
        ],
      },
    ],
  },

  // ===== 23 Back Pain =====
  {
    id: "back_pain",
    name: "Back Pain",
    icon: "walk-outline",
    description: "Lower back, flank, or pelvic pain",
    category: "musculoskeletal",
    questions: [
      {
        id: "bp1",
        text: "Where exactly is the pain?",
        options: [
          { label: "Lower back — both sides", next: "bp2" },
          { label: "One side (flank) — below the ribs", next: "bp3" },
          { label: "Pubic area — shooting pain when walking", outcome: { severity: "yellow", title: "Likely SPD — see your doctor", message: "Symphysis pubis dysfunction (SPD) causes shooting pain in the pubic area and a waddling gait.", action: "Physiotherapy referral. Pelvic support belt may help. Avoid stairs. Do not push through the pain." } },
        ],
      },
      {
        id: "bp2",
        text: "Does the pain come in waves or is it constant?",
        options: [
          { label: "Comes in waves — tightening feeling", next: "bp4" },
          { label: "Constant dull ache, worse at end of day", outcome: { severity: "green", title: "Likely mechanical back pain", message: "Postural back pain is extremely common in pregnancy — affecting 50–70% of women.", action: "Warm compress on lower back. Avoid carrying heavy objects. Supportive footwear. Gentle stretching and prenatal exercises." } },
        ],
      },
      {
        id: "bp3",
        text: "Do you have fever or pain passing urine alongside the flank pain?",
        options: [
          { label: "Yes — fever and/or urinary symptoms", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Flank pain + fever + UTI symptoms = pyelonephritis (kidney infection). IV antibiotics are required.", action: "Hospital immediately. Request urine culture before antibiotics. IV antibiotics are needed — oral antibiotics are inadequate for pyelonephritis in pregnancy." } },
          { label: "No fever or urinary symptoms", outcome: { severity: "yellow", title: "See your doctor today", message: "One-sided flank pain without infection signs still needs assessment to exclude kidney stones or other causes.", action: "See your doctor today for assessment. Rest and take paracetamol for pain." } },
        ],
      },
      {
        id: "bp4",
        text: "How many weeks pregnant are you?",
        options: [
          { label: "Less than 37 weeks", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Wave-like back pain before 37 weeks with regular pattern = possible preterm labour with back presentation.", action: "Hospital immediately. This is regular labour pain felt in the back rather than abdomen. Do NOT take herbs." } },
          { label: "37 weeks or more", outcome: { severity: "yellow", title: "Possible early labour", message: "Regular back tightenings at term may be the start of labour — some women feel contractions mainly in the back.", action: "Time the waves. If they become regular (every 5 minutes), go to hospital. If they stop, this is likely Braxton Hicks." } },
        ],
      },
    ],
  },

  // ===== 24 Postpartum Red Flags =====
  {
    id: "postpartum",
    name: "Postpartum Red Flags",
    icon: "rose-outline",
    description: "Concerns after delivery (within 6 weeks)",
    category: "postpartum",
    questions: [
      {
        id: "pp1",
        text: "What is your main concern since delivery?",
        options: [
          { label: "Heavy bleeding — getting worse", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Increasing vaginal bleeding after delivery = secondary PPH from retained products or endometritis.", action: "Hospital same day. Ultrasound to exclude retained products. Misoprostol or surgical evacuation may be needed." } },
          { label: "Fever and/or foul-smelling discharge", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Fever + foul discharge after delivery = puerperal sepsis. IV antibiotics needed within 1 hour.", action: "Hospital immediately. Broad-spectrum IV antibiotics. Tell the nurse when you gave birth and describe the discharge." } },
          { label: "CS wound opening or producing pus", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Wound breakdown or deep surgical site infection requires urgent assessment.", action: "Hospital same day. IV antibiotics and wound irrigation. May require return to theatre." } },
          { label: "Seizure, severe headache, or vision changes", outcome: { severity: "red", title: "Go to a hospital NOW!", message: "Postpartum eclampsia can occur up to 6 weeks after birth. Seizure post-delivery = eclampsia until proven otherwise.", action: "Hospital immediately. Magnesium sulphate is needed. Do NOT take herbs." } },
        ],
      },
    ],
  },

  // ===== 25 Mental Health =====
  {
    id: "mental_health",
    name: "Mental Health / Mood",
    icon: "happy-outline",
    description: "Low mood, anxiety, unusual behaviour",
    category: "mental_health",
    questions: [
      {
        id: "mh1",
        text: "Over the past 2 weeks, have you been feeling very low, hopeless, or tearful much of the time?",
        options: [
          { label: "Yes — most days", next: "mh2" },
          { label: "Sometimes but not most days", next: "mh3" },
          { label: "No — but I have other concerns", next: "mh4" },
        ],
      },
      {
        id: "mh2",
        text: "Are you having thoughts of harming yourself, not wanting to be alive, or harming your baby?",
        options: [
          { label: "Yes — thoughts of harm to self or baby", outcome: { severity: "red", title: "Please seek help NOW", message: "You are not alone and this is not your fault. These thoughts are a medical condition that can be treated. You deserve immediate support.", action: "Please tell someone you trust right now. Call your doctor or go to the nearest hospital. If in Lagos, call the mental health helpline. You are brave for answering honestly." } },
          { label: "No — just very low mood", outcome: { severity: "yellow", title: "Talk to your doctor this week", message: "Persistent low mood for most days over 2 weeks may be depression. This is common and very treatable.", action: "See your doctor this week. Postnatal depression affects 10–23% of Nigerian mothers. It is NOT a sign of weakness. Treatment helps." } },
        ],
      },
      {
        id: "mh3",
        text: "Are you finding it hard to bond with your baby or feel any warmth towards them?",
        options: [
          { label: "Yes — finding bonding difficult", outcome: { severity: "yellow", title: "Talk to your doctor", message: "Difficulty bonding is a sensitive sign of postnatal depression. This is not your fault and can improve with support.", action: "Talk to your doctor or midwife. This does not make you a bad mother. With proper support, bonding improves." } },
          { label: "No — just feeling a bit low", outcome: { severity: "green", title: "Monitor and seek support", message: "Mild mood changes after birth ('baby blues') are very common and usually improve within 2 weeks.", action: "Rest when you can. Accept help from family. If feelings persist beyond 2 weeks or worsen, see your doctor." } },
        ],
      },
      {
        id: "mh4",
        text: "Have you had confusion, hearing/seeing things others cannot, or very strange behaviour since delivery?",
        options: [
          { label: "Yes — confusion or hallucinations", outcome: { severity: "red", title: "MEDICAL EMERGENCY — hospital NOW", message: "Confusion or hallucinations after delivery = postpartum psychosis. This is rare but life-threatening. It is NOT spiritual — it is a medical condition.", action: "Hospital immediately for psychiatric assessment. This is the only psychiatric condition that requires the same urgency as a physical emergency. NOT prayer, NOT herbs, NOT waiting." } },
          { label: "No — other mental health concern", outcome: { severity: "yellow", title: "Speak with a healthcare provider", message: "Whatever you're experiencing, you deserve support. There is no shame in asking for help.", action: "Talk to your doctor or midwife about how you're feeling. Your mental health is as important as your physical health." } },
        ],
      },
    ],
  },
];

export default PATHWAYS;

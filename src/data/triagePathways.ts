export type Severity = "green" | "yellow" | "red";

export interface TriageOutcome {
  severity: Severity;
  title: string;
  message: string;
  action: string;
}

export interface TriageOption {
  label: string;
  next?: string; // next question id
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
  questions: TriageQuestion[];
}

const PATHWAYS: TriagePathway[] = [
  {
    id: "bleeding",
    name: "Bleeding",
    icon: "water-outline",
    description: "Vaginal bleeding or spotting",
    questions: [
      {
        id: "b1",
        text: "How heavy is the bleeding?",
        options: [
          { label: "Light spotting (a few drops)", next: "b2" },
          { label: "Like a period — using pads", next: "b3" },
          { label: "Heavy — soaking a pad in under an hour", outcome: { severity: "red", title: "Go to hospital now", message: "Heavy bleeding in pregnancy requires immediate medical evaluation. Do not wait.", action: "Call your doctor or go to the nearest emergency room immediately." } },
        ],
      },
      {
        id: "b2",
        text: "Do you have any pain or cramping with the spotting?",
        options: [
          { label: "No pain at all", outcome: { severity: "green", title: "Monitor at home", message: "Light spotting without pain is common, especially in early pregnancy. Rest and avoid heavy activity.", action: "Rest, stay hydrated, and monitor. If bleeding increases, contact your doctor." } },
          { label: "Mild cramping", outcome: { severity: "yellow", title: "Call your doctor today", message: "Spotting with cramping may need medical review, though it's often not serious.", action: "Call your doctor or midwife today to discuss your symptoms." } },
          { label: "Severe pain", outcome: { severity: "red", title: "Go to hospital now", message: "Spotting with severe pain could indicate a serious complication like ectopic pregnancy.", action: "Go to the nearest emergency room immediately." } },
        ],
      },
      {
        id: "b3",
        text: "What colour is the blood?",
        options: [
          { label: "Brown or dark", outcome: { severity: "yellow", title: "Call your doctor today", message: "Dark blood is usually older blood and may not indicate an active problem, but should be evaluated.", action: "Contact your doctor today to schedule an evaluation." } },
          { label: "Bright red", outcome: { severity: "red", title: "Go to hospital now", message: "Bright red period-like bleeding needs urgent evaluation to rule out complications.", action: "Go to the nearest hospital or call your doctor immediately." } },
        ],
      },
    ],
  },
  {
    id: "headache",
    name: "Headache",
    icon: "flash-outline",
    description: "Head pain, vision changes",
    questions: [
      {
        id: "h1",
        text: "How would you describe the headache?",
        options: [
          { label: "Mild — I can still do my daily activities", next: "h2" },
          { label: "Severe — worst headache I've ever had", next: "h3" },
        ],
      },
      {
        id: "h2",
        text: "Do you have any other symptoms?",
        options: [
          { label: "No other symptoms", outcome: { severity: "green", title: "Monitor at home", message: "Mild headaches are common in pregnancy. Rest, hydrate, and try a cool cloth on your forehead.", action: "Rest, drink water, and take paracetamol if needed. If it worsens, contact your doctor." } },
          { label: "Blurry vision or seeing spots", outcome: { severity: "red", title: "Go to hospital now", message: "Headache with vision changes could be a sign of preeclampsia, which needs urgent care.", action: "Go to the nearest hospital immediately. This could be preeclampsia." } },
          { label: "Swelling in hands or face", outcome: { severity: "red", title: "Go to hospital now", message: "Headache with sudden swelling may indicate preeclampsia.", action: "Go to the nearest hospital immediately for blood pressure and urine checks." } },
        ],
      },
      {
        id: "h3",
        text: "Do you also have any of these?",
        options: [
          { label: "Vision changes or seeing flashing lights", outcome: { severity: "red", title: "Go to hospital now", message: "Severe headache with vision changes is a medical emergency in pregnancy.", action: "Go to the nearest emergency room immediately. Do not wait." } },
          { label: "Nausea or vomiting", outcome: { severity: "yellow", title: "Call your doctor today", message: "Severe headache with nausea should be evaluated today to rule out complications.", action: "Call your doctor or midwife now. If you can't reach them, go to hospital." } },
          { label: "No other symptoms", outcome: { severity: "yellow", title: "Call your doctor today", message: "A severe headache that's unusual for you should be evaluated by your doctor.", action: "Call your doctor today. If the headache doesn't improve, go to hospital." } },
        ],
      },
    ],
  },
  {
    id: "abdominal_pain",
    name: "Abdominal Pain",
    icon: "body-outline",
    description: "Stomach or lower belly pain",
    questions: [
      {
        id: "a1",
        text: "Where is the pain?",
        options: [
          { label: "Lower belly, both sides", next: "a2" },
          { label: "One side only", next: "a3" },
          { label: "Upper belly, under ribs", outcome: { severity: "yellow", title: "Call your doctor today", message: "Upper abdominal pain, especially on the right side, can sometimes indicate liver or gallbladder issues.", action: "Call your doctor today. If the pain is severe, go to hospital." } },
        ],
      },
      {
        id: "a2",
        text: "How would you describe the pain?",
        options: [
          { label: "Mild stretching or pulling feeling", outcome: { severity: "green", title: "Monitor at home", message: "Round ligament pain and stretching sensations are normal as your uterus grows.", action: "Rest, use a warm (not hot) compress, and change positions slowly." } },
          { label: "Coming and going like contractions", next: "a4" },
          { label: "Constant and getting worse", outcome: { severity: "red", title: "Go to hospital now", message: "Constant worsening abdominal pain needs immediate evaluation.", action: "Go to the nearest hospital immediately." } },
        ],
      },
      {
        id: "a3",
        text: "How severe is the one-sided pain?",
        options: [
          { label: "Mild — comes and goes", outcome: { severity: "yellow", title: "Call your doctor today", message: "One-sided pain should be evaluated, especially in early pregnancy, to rule out ectopic pregnancy.", action: "Call your doctor today to arrange an assessment." } },
          { label: "Sharp and severe", outcome: { severity: "red", title: "Go to hospital now", message: "Severe one-sided pain could indicate an ectopic pregnancy or ovarian issue.", action: "Go to the nearest emergency room immediately." } },
        ],
      },
      {
        id: "a4",
        text: "How far along are you?",
        options: [
          { label: "Less than 37 weeks", outcome: { severity: "red", title: "Go to hospital now", message: "Contraction-like pain before 37 weeks could indicate preterm labour.", action: "Go to your nearest hospital immediately. Time the contractions if you can." } },
          { label: "37 weeks or more", outcome: { severity: "yellow", title: "Call your doctor today", message: "You may be in early labour. Time your contractions and monitor their pattern.", action: "Call your doctor or hospital. Go in if contractions are 5 minutes apart and lasting 1 minute." } },
        ],
      },
    ],
  },
  {
    id: "swelling",
    name: "Swelling",
    icon: "hand-left-outline",
    description: "Swollen hands, feet or face",
    questions: [
      {
        id: "s1",
        text: "Where is the swelling?",
        options: [
          { label: "Feet and ankles (both sides)", next: "s2" },
          { label: "Hands and/or face", next: "s3" },
          { label: "One leg only", outcome: { severity: "red", title: "Go to hospital now", message: "Swelling in one leg only could indicate a blood clot (DVT), which is a medical emergency.", action: "Go to the nearest hospital immediately for evaluation." } },
        ],
      },
      {
        id: "s2",
        text: "When did the swelling start?",
        options: [
          { label: "It's been gradual over days/weeks", outcome: { severity: "green", title: "Monitor at home", message: "Mild, gradual ankle swelling is very common in pregnancy, especially in the third trimester.", action: "Elevate your feet, stay hydrated, and avoid standing for long periods." } },
          { label: "Suddenly today", next: "s3" },
        ],
      },
      {
        id: "s3",
        text: "Do you also have a headache or vision changes?",
        options: [
          { label: "Yes — headache and/or blurry vision", outcome: { severity: "red", title: "Go to hospital now", message: "Sudden swelling with headache or vision changes are warning signs of preeclampsia.", action: "Go to the nearest hospital immediately. This is urgent." } },
          { label: "No other symptoms", outcome: { severity: "yellow", title: "Call your doctor today", message: "Sudden swelling in the hands or face should be evaluated by your doctor today.", action: "Call your doctor today to check your blood pressure and urine protein." } },
        ],
      },
    ],
  },
  {
    id: "reduced_movement",
    name: "Reduced Movement",
    icon: "fitness-outline",
    description: "Baby moving less than usual",
    questions: [
      {
        id: "r1",
        text: "When did you last feel the baby move?",
        options: [
          { label: "Within the last 2 hours", next: "r2" },
          { label: "More than 2 hours ago but today", next: "r3" },
          { label: "Not at all today", outcome: { severity: "red", title: "Go to hospital now", message: "If you haven't felt your baby move at all today, you need urgent assessment.", action: "Go to the nearest hospital immediately for monitoring." } },
        ],
      },
      {
        id: "r2",
        text: "Does the movement pattern feel different from normal?",
        options: [
          { label: "Slightly less but still moving", outcome: { severity: "green", title: "Monitor at home", message: "Your baby is still moving. Try lying on your left side, drink something cold, and count movements for an hour.", action: "Count kicks for 1 hour. You should feel at least 10 movements. If not, call your doctor." } },
          { label: "Noticeably weaker or different", outcome: { severity: "yellow", title: "Call your doctor today", message: "A change in your baby's movement pattern should be checked by your healthcare provider.", action: "Call your doctor or midwife today. They may want to monitor the baby." } },
        ],
      },
      {
        id: "r3",
        text: "Have you tried lying down and counting kicks?",
        options: [
          { label: "Yes — fewer than 10 in 2 hours", outcome: { severity: "red", title: "Go to hospital now", message: "Fewer than 10 movements in 2 hours after focused counting needs urgent assessment.", action: "Go to the nearest hospital for fetal monitoring. Do not wait." } },
          { label: "No, I haven't tried yet", outcome: { severity: "yellow", title: "Try kick counting now", message: "Lie on your left side, drink something cold, and count your baby's movements for 2 hours.", action: "If you feel fewer than 10 movements in 2 hours, go to the hospital immediately." } },
        ],
      },
    ],
  },
  {
    id: "fever",
    name: "Fever",
    icon: "thermometer-outline",
    description: "High temperature or chills",
    questions: [
      {
        id: "f1",
        text: "What is your temperature?",
        options: [
          { label: "Slightly warm (37.5–38°C)", next: "f2" },
          { label: "High (above 38°C)", next: "f3" },
          { label: "I haven't checked but feel hot/cold", next: "f2" },
        ],
      },
      {
        id: "f2",
        text: "Do you have any other symptoms?",
        options: [
          { label: "Runny nose or mild cough", outcome: { severity: "green", title: "Monitor at home", message: "You likely have a mild viral infection. Rest and stay hydrated.", action: "Rest, drink fluids, take paracetamol if needed. See your doctor if fever lasts more than 48 hours." } },
          { label: "Pain when urinating", outcome: { severity: "yellow", title: "Call your doctor today", message: "Fever with urinary symptoms could indicate a urinary tract infection, which needs antibiotics in pregnancy.", action: "Call your doctor today for a urine test and possible antibiotics." } },
          { label: "Body aches and severe weakness", outcome: { severity: "yellow", title: "Call your doctor today", message: "These symptoms should be evaluated, especially to rule out malaria or other infections.", action: "Call your doctor today. They may want to run blood tests." } },
        ],
      },
      {
        id: "f3",
        text: "How long have you had the fever?",
        options: [
          { label: "Just started today", outcome: { severity: "yellow", title: "Call your doctor today", message: "A high fever in pregnancy should be evaluated promptly to identify the cause.", action: "Take paracetamol to bring down the fever and call your doctor today." } },
          { label: "More than 24 hours", outcome: { severity: "red", title: "Go to hospital now", message: "A persistent high fever in pregnancy can affect the baby and needs urgent treatment.", action: "Go to the nearest hospital for evaluation and treatment." } },
          { label: "With chills and shaking", outcome: { severity: "red", title: "Go to hospital now", message: "High fever with rigors (shaking chills) could indicate a serious infection like malaria.", action: "Go to the nearest hospital immediately for blood tests and treatment." } },
        ],
      },
    ],
  },
];

export default PATHWAYS;

// Blood pressure classification (pregnancy-aware, AHA-aligned)
// Order of severity (low → high): Critical Low → Low → Normal → Elevated → Stage 1 → Stage 2 → Crisis

export type BPCategoryKey =
  | "critical_low"
  | "low"
  | "normal"
  | "elevated"
  | "stage1"
  | "stage2"
  | "crisis";

export type BPSeverity = "emergency" | "warning" | "caution" | "normal";

export interface BPCategory {
  key: BPCategoryKey;
  label: string;         // short chip label
  shortTag: string;      // one-line tag with emoji-free phrasing
  range: string;
  severity: BPSeverity;
  color: string;         // token/hex
  bg: string;
  border: string;
  clinicalRemark: string;
  doNow: string[];
  doNot?: string[];
  eat?: string[];
  avoid?: string[];
  redFlags?: string[];
  followUp?: string;
}

const CATEGORIES: Record<BPCategoryKey, Omit<BPCategory, "key">> = {
  critical_low: {
    label: "Critical Low — Seek care now",
    shortTag: "Critical Low",
    range: "<80/50 mmHg",
    severity: "emergency",
    color: "hsl(var(--coral))",
    bg: "hsl(var(--light-coral))",
    border: "hsl(var(--coral))",
    clinicalRemark:
      "Severe hypotension. Risk of hypoperfusion to brain, kidneys, and fetus. Possible hemorrhage, sepsis, or dehydration.",
    doNow: [
      "Lie flat and elevate your legs",
      "Sip ORS or water with a pinch of salt and sugar",
      "Eat a light salty snack such as groundnuts",
    ],
    doNot: ["Stand or drive", "Take a hot bath", "Take additional medication"],
    redFlags: [
      "Fainting or altered mental status",
      "Persistent vomiting",
      "Bleeding or fever",
      "BP does not improve within 15 minutes",
    ],
    followUp: "Go to a health facility immediately if any red flag is present.",
  },
  low: {
    label: "Low — Please monitor",
    shortTag: "Low",
    range: "80/50 – 89/59 mmHg",
    severity: "caution",
    color: "hsl(45 90% 35%)",
    bg: "hsl(45 93% 92%)",
    border: "hsl(45 90% 50%)",
    clinicalRemark:
      "Below normal range. Common in 1st and 2nd trimester. Risk of dizziness and syncope.",
    doNow: [
      "Increase fluids: water, ORS, coconut water",
      "Eat small frequent meals (5–6× daily)",
      "Rise slowly from lying or sitting",
    ],
    eat: ["Liver", "Beans", "Ugwu", "Dates", "Spinach", "A pinch of salt if not contraindicated"],
    avoid: [
      "Prolonged standing",
      "Hot environments",
      "Skipping meals",
      "Sudden position changes",
    ],
    redFlags: ["Dizziness, fainting, blurred vision or weakness persisting — see your doctor"],
  },
  normal: {
    label: "Normal — Looking good!",
    shortTag: "Normal",
    range: "<120/80 mmHg",
    severity: "normal",
    color: "hsl(var(--green))",
    bg: "hsl(var(--light-green))",
    border: "hsl(var(--green))",
    clinicalRemark:
      "Blood pressure is within a healthy range for pregnancy and general adult population.",
    doNow: [
      "Maintain hydration: 2–3L water daily",
      "Balanced diet",
      "Light activity: 20–30 min walk 4–5×/week",
      "Sleep 7–8 hours",
    ],
    eat: ["Beans", "Eggs", "Fish", "Ugu", "Ewedu", "Oranges", "Pawpaw", "Banana", "Brown rice", "Moi-moi"],
    avoid: ["Skipping meals", "Chronic stress", "Dehydration"],
    followUp: "Recheck weekly. See your doctor at your next scheduled antenatal visit.",
  },
  elevated: {
    label: "Elevated — Monitor",
    shortTag: "Elevated",
    range: "120/80 – 129/89 mmHg",
    severity: "caution",
    color: "hsl(45 90% 35%)",
    bg: "hsl(45 93% 92%)",
    border: "hsl(45 90% 50%)",
    clinicalRemark:
      "Systolic is above optimal but diastolic is still normal. Not hypertension yet, but a risk factor. Requires lifestyle monitoring.",
    doNow: ["Rest 5–10 minutes then recheck BP", "Increase fluids", "Prioritise sleep"],
    eat: ["Garden egg", "Cucumber", "Okra", "Oats", "Moi-moi", "High-potassium foods"],
    avoid: [
      "Excess sodium: Maggi cubes, stockfish, dried fish",
      "Canned drinks and salty snacks",
      "Caffeine",
      "Stress",
    ],
    followUp:
      "Recheck BP twice daily for 3 days. If ≥130/80 mmHg on 2 occasions, see your doctor.",
  },
  stage1: {
    label: "High BP Stage 1 — See your doctor",
    shortTag: "Stage 1",
    range: "130/80 – 139/89 mmHg",
    severity: "warning",
    color: "hsl(24 90% 45%)",
    bg: "hsl(24 95% 94%)",
    border: "hsl(24 90% 55%)",
    clinicalRemark:
      "Hypertension. In pregnancy this requires evaluation to rule out gestational hypertension or preeclampsia.",
    doNow: [
      "Rest 10 minutes then recheck BP",
      "Document readings — keep a daily BP log",
      "Light exercise 15 min if approved by your doctor",
    ],
    eat: ["Fruits and vegetables", "Low-fat dairy", "Fish", "Beans", "Limit sodium <2g/day"],
    avoid: [
      "Caffeine and energy drinks",
      "Kpomo",
      "Pepper soup with excess Maggi",
      "Fried foods",
      "Alcohol",
    ],
    followUp:
      "See your doctor within 1 week. If pregnant, seek urgent evaluation for proteinuria and preeclampsia symptoms.",
  },
  stage2: {
    label: "High BP Stage 2 — See your doctor soon",
    shortTag: "Stage 2",
    range: "140/90 – 179/119 mmHg",
    severity: "warning",
    color: "hsl(var(--coral))",
    bg: "hsl(var(--light-coral))",
    border: "hsl(var(--coral))",
    clinicalRemark:
      "Stage 2 Hypertension. Increased risk of maternal and fetal complications. Requires prompt assessment.",
    doNow: [
      "Sit and rest 5 minutes, then recheck",
      "If still ≥140/90 mmHg, contact your health facility today",
      "Take prescribed medications — do not stop without your doctor",
    ],
    eat: ["Light soups with vegetables", "Grilled fish", "Small portions of swallow (garri, fufu)"],
    avoid: ["High-fat red meat", "Canned foods", "Excess palm oil", "NSAIDs", "Smoking"],
    redFlags: [
      "Severe headache",
      "Visual changes",
      "Epigastric pain",
      "Facial, hand or leg swelling",
      "Decreased fetal movement",
    ],
    followUp: "If any red flag appears, go to a health facility immediately.",
  },
  crisis: {
    label: "Hypertensive Crisis — Seek care now",
    shortTag: "Crisis",
    range: "≥180/120 mmHg",
    severity: "emergency",
    color: "hsl(var(--coral))",
    bg: "hsl(var(--light-coral))",
    border: "hsl(var(--coral))",
    clinicalRemark:
      "Medical emergency. Risk of stroke, eclampsia, organ damage, and fetal compromise.",
    doNow: [
      "Do not wait and do not drive",
      "Go to the emergency department NOW",
      "Stay calm, loosen clothing, sit upright",
      "Take your BP medication as prescribed",
    ],
    doNot: ["Take herbal remedies", "Delay hospital care"],
    redFlags: [
      "Chest pain",
      "Severe headache",
      "Shortness of breath",
      "Confusion or seizures",
      "Vaginal bleeding",
    ],
    followUp: "Emergency evaluation at a hospital or health facility is mandatory.",
  },
};

export function classifyBP(sys?: number, dia?: number): BPCategory | null {
  if (!sys || !dia) return null;
  let key: BPCategoryKey;
  if (sys >= 180 || dia >= 120) key = "crisis";
  else if (sys < 80 || dia < 50) key = "critical_low";
  else if (sys >= 140 || dia >= 90) key = "stage2";
  else if (sys >= 130 || dia >= 80) key = "stage1";
  else if (sys >= 120 && dia < 80) key = "elevated";
  else if (sys < 90 || dia < 60) key = "low";
  else key = "normal";
  return { key, ...CATEGORIES[key] };
}

export const BP_CATEGORIES = CATEGORIES;

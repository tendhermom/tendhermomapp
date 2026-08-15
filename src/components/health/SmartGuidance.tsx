import { useMemo } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import { classifyBP } from "@/lib/bpClassification";

interface HealthEntry {
  id: string;
  date: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  weight?: number;
}

interface SmartGuidanceProps {
  entries: HealthEntry[];
  currentWeek: number;
}

interface Guidance {
  icon: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "alert";
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const SmartGuidance = ({ entries, currentWeek }: SmartGuidanceProps) => {
  const guidance = useMemo((): Guidance[] => {
    if (entries.length === 0) return [];
    const tips: Guidance[] = [];
    const latest = entries[0];

    // Current guidance is based on the newest reading only. Older entries are history.
    if (latest?.systolic && latest?.diastolic) {
      const category = classifyBP(latest.systolic, latest.diastolic);

      if (category) {
        const severityMap: Record<typeof category.severity, Guidance["severity"]> = {
          emergency: "alert",
          warning: "alert",
          caution: "warning",
          normal: "info",
        };
        const icon =
          category.severity === "emergency"
            ? "warning"
            : category.severity === "warning"
              ? "alert-circle"
              : category.severity === "caution"
                ? "alert-circle"
                : "checkmark-circle";
        const pregnancyNote =
          (category.key === "stage1" || category.key === "stage2" || category.key === "crisis") &&
          currentWeek >= 20
            ? " Preeclampsia risk rises after week 20 — flag any headache, visual changes or swelling."
            : "";
        tips.push({
          icon,
          title: `${category.shortTag} · ${latest.systolic}/${latest.diastolic} mmHg`,
          message: `${category.clinicalRemark}${pregnancyNote} Tap the BP status on your card above for full guidance.`,
          severity: severityMap[category.severity],
        });
      }

    }

    // Heart rate analysis
    if (latest?.heartRate) {
      if (latest.heartRate > 110) {
        tips.push({
          icon: "pulse",
          title: "Heart Rate Is High",
          message: `Your latest heart rate is ${latest.heartRate} bpm. While slight increases are normal in pregnancy, rates above 100 bpm should be discussed with your doctor.`,
          severity: "warning",
        });
      } else if (latest.heartRate >= 80 && latest.heartRate <= 110) {
        tips.push({
          icon: "pulse",
          title: "Heart Rate Is Normal",
          message: `${latest.heartRate} bpm is within the expected range for pregnancy. Your heart is working harder to support baby's growth.`,
          severity: "info",
        });
      }
    }

    // Weight analysis

    // Week-specific guidance
    if (currentWeek <= 12) {
      tips.push({
        icon: "leaf",
        title: "First Trimester Tip",
        message: "Take 400mcg folic acid daily. Eat small, frequent meals to manage nausea. Avoid raw fish, soft cheese, and excess caffeine.",
        severity: "info",
      });
    } else if (currentWeek <= 26) {
      tips.push({
        icon: "fitness",
        title: "Second Trimester Tip",
        message: "This is a great time for gentle exercise like walking or prenatal yoga. Stay hydrated and start thinking about your birth plan.",
        severity: "info",
      });
    } else if (currentWeek <= 36) {
      tips.push({
        icon: "bed",
        title: "Third Trimester Tip",
        message: "Rest when you can. Sleep on your left side to improve blood flow. Pack your hospital bag and keep your emergency contacts updated.",
        severity: "info",
      });
    } else {
      tips.push({
        icon: "star",
        title: "Almost There!",
        message: "Baby could arrive any day! Watch for signs of labour: regular contractions, water breaking, or lower back pain. Stay calm and contact your doctor.",
        severity: "info",
      });
    }

    return tips;
  }, [entries, currentWeek]);

  if (guidance.length === 0) return null;

  const severityStyles = {
    alert: { bg: "hsl(var(--light-coral))", color: "hsl(var(--coral))" },
    warning: { bg: "hsl(45 93% 92%)", color: "hsl(45 90% 35%)" },
    info: { bg: "hsl(var(--light-green))", color: "hsl(var(--green))" },
  };

  return (
    <motion.div variants={fadeUp} className="space-y-2">
      <p className="label-caps text-text-muted mb-2">SMART HEALTH GUIDANCE</p>
      {guidance.map((g, i) => {
        const style = severityStyles[g.severity];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="tend-card p-4 flex items-start gap-3"
          >
            <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: style.bg }}>
              <IonIcon name={g.icon} size={16} style={{ color: style.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-sans font-semibold mb-0.5" style={{ color: "hsl(var(--dark))" }}>{g.title}</h4>
              <p className="text-[11px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>{g.message}</p>
            </div>
          </motion.div>
        );
      })}
      <MedicalDisclaimer className="pt-1" />
    </motion.div>
  );
};

export default SmartGuidance;

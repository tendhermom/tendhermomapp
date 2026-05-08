import IonIcon from "@/components/IonIcon";

interface MedicalDisclaimerProps {
  /** "subtle" — inline muted text. "card" — coral-tinted card (use over busy contexts like chat). */
  variant?: "subtle" | "card";
  className?: string;
}

/**
 * Standardized medical disclaimer used across Triage, SOS, AI Chat, and SmartGuidance.
 * Keeps icon, padding, and font sizing identical for a unified premium hierarchy.
 */
const MedicalDisclaimer = ({ variant = "subtle", className = "" }: MedicalDisclaimerProps) => {
  if (variant === "card") {
    return (
      <div
        className={`rounded-[12px] px-3 py-2 flex items-start gap-2 ${className}`}
        style={{ background: "hsl(var(--light-coral))" }}
      >
        <IonIcon
          name="shield-checkmark"
          size={14}
          style={{ color: "hsl(var(--coral))", marginTop: 2, flexShrink: 0 }}
        />
        <p className="text-[10px] font-sans leading-[1.5]" style={{ color: "hsl(var(--coral))" }}>
          This tool does not replace professional medical advice.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 px-1 ${className}`}>
      <IonIcon
        name="shield-checkmark"
        size={14}
        style={{ color: "hsl(var(--green))", marginTop: 2, flexShrink: 0 }}
      />
      <p className="text-[10px] font-sans leading-[1.5]" style={{ color: "hsl(var(--text-muted))" }}>
        This tool does not replace professional medical advice.
      </p>
    </div>
  );
};

export default MedicalDisclaimer;

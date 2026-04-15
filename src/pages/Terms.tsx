import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface TermsProps {
  onBack?: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const sections = [
  {
    icon: "checkmark-circle-outline",
    title: "1. Acceptance of Terms",
    content: "By creating an account or using TendherMom, you agree to these Terms of Service. If you do not agree, do not use the app.",
  },
  {
    icon: "apps-outline",
    title: "2. Description of Service",
    content: "TendherMom is a maternal health companion application that provides:",
    items: [
      "Pregnancy tracking and trimester-based health guidance",
      "Symptom triage assessment (not a substitute for professional medical advice)",
      "Emergency SOS alerts to designated contacts",
      "Trimester-specific community forums",
      "Baby shower celebration features",
    ],
  },
  {
    icon: "medkit-outline",
    title: "3. Medical Disclaimer",
    content: "TendherMom is NOT a substitute for professional medical advice, diagnosis, or treatment. The triage feature provides general guidance only. Always consult a qualified healthcare provider for medical concerns. In a medical emergency, call your local emergency services immediately.",
    highlight: true,
  },
  {
    icon: "person-circle-outline",
    title: "4. User Accounts",
    items: [
      "You must provide accurate information when creating an account",
      "You are responsible for maintaining the security of your account credentials",
      "You must be at least 16 years old to use TendherMom",
      "One account per person — duplicate accounts may be terminated",
    ],
  },
  {
    icon: "people-outline",
    title: "5. Community Guidelines",
    content: "When participating in community forums, you agree to:",
    items: [
      "Be respectful and supportive of other mothers",
      "Not post medical advice or diagnoses",
      "Not share harmful, hateful, or misleading content",
      "Not engage in spam, harassment, or commercial solicitation",
      "Not share other users' personal information",
    ],
    footer: "We reserve the right to remove content and suspend accounts that violate these guidelines.",
  },
  {
    icon: "alert-circle-outline",
    title: "6. SOS Emergency Feature",
    content: "The SOS feature sends alerts to your designated emergency contacts. TendherMom is not an emergency service and does not guarantee message delivery. You are responsible for maintaining accurate emergency contact information. Do not rely solely on this feature in life-threatening situations — always call emergency services.",
  },
  {
    icon: "close-circle-outline",
    title: "7. Account Termination",
    content: "You may delete your account at any time from Profile settings. We may suspend or terminate accounts that violate these terms. Upon termination, all your data will be permanently deleted.",
  },
  {
    icon: "warning-outline",
    title: "8. Limitation of Liability",
    content: "TendherMom is provided \"as is\" without warranties of any kind. We are not liable for any damages arising from your use of the app, including but not limited to health outcomes, missed emergency alerts, or community interactions.",
  },
  {
    icon: "create-outline",
    title: "9. Changes to Terms",
    content: "We may update these terms at any time. Continued use of TendherMom after changes constitutes acceptance of the updated terms.",
  },
  {
    icon: "mail-outline",
    title: "10. Contact",
    content: "Questions about these terms? Contact us at legal@tendhermom.com",
    email: "legal@tendhermom.com",
  },
];

const Terms = ({ onBack }: TermsProps = {}) => {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <div className="min-h-screen flex justify-center" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-[430px]" style={{ paddingTop: "calc(var(--safe-area-top, 0px) + 12px)" }}>
        <motion.div
          className="px-5 pb-10"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {/* Back button */}
          <motion.button
            variants={fadeUp}
            whileTap={{ scale: 0.92 }}
            onClick={handleBack}
            className="flex items-center gap-1.5 mb-6"
          >
            <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--green))" }} />
            <span className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--green))" }}>Back</span>
          </motion.button>

          {/* Hero */}
          <motion.div
            variants={fadeUp}
            className="rounded-[20px] p-6 mb-6"
            style={{
              background: "linear-gradient(145deg, hsl(153 42% 22%), hsl(153 42% 32%))",
              boxShadow: "0 12px 40px -8px hsla(153, 42%, 22%, 0.45)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)" }}>
                <IonIcon name="document-text" size={22} style={{ color: "hsl(var(--coral))" }} />
              </div>
            </div>
            <h1 className="text-white font-serif text-[26px] leading-tight tracking-[-0.01em]">
              Terms of Service
            </h1>
            <p className="text-white/50 text-[12px] font-sans mt-2">
              Last updated: March 16, 2026
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((section, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                className="tend-card overflow-hidden"
                style={section.highlight ? {
                  borderLeft: "3px solid hsl(var(--coral))",
                } : undefined}
              >
                {/* Section header */}
                <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                  <div
                    className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: section.highlight ? "hsl(var(--light-coral))" : "hsl(var(--light-green))" }}
                  >
                    <IonIcon name={section.icon} size={18} style={{ color: section.highlight ? "hsl(var(--coral))" : "hsl(var(--green))" }} />
                  </div>
                  <h2 className="text-[15px] font-sans font-bold" style={{ color: "hsl(var(--dark))" }}>
                    {section.title}
                  </h2>
                </div>

                {/* Section body */}
                <div className="px-5 pb-5">
                  {section.content && (
                    <p className={`text-[13px] font-sans leading-[1.7] ${section.items || section.footer ? "mb-2" : ""}`}
                      style={{ color: "hsl(var(--text-muted))", fontWeight: section.highlight ? 600 : 400 }}>
                      {section.email ? (
                        <>Questions about these terms? Contact us at{" "}
                          <span className="font-semibold" style={{ color: "hsl(var(--green))" }}>{section.email}</span>
                        </>
                      ) : section.content}
                    </p>
                  )}
                  {section.items && (
                    <div className="space-y-2 mt-1">
                      {section.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-[6px] h-[6px] rounded-full mt-[7px] flex-shrink-0"
                            style={{ background: "hsl(var(--green))" }} />
                          <p className="text-[13px] font-sans leading-[1.7]" style={{ color: "hsl(var(--text-muted))" }}>
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.footer && (
                    <p className="text-[12px] font-sans mt-3 leading-[1.6]" style={{ color: "hsl(var(--text-muted))" }}>
                      {section.footer}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <motion.p variants={fadeUp} className="text-center text-[11px] font-sans mt-6" style={{ color: "hsl(var(--text-muted))" }}>
            © {new Date().getFullYear()} TendherMom. All rights reserved.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;

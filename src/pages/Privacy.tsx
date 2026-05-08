import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface PrivacyProps {
  onBack?: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const sections = [
  {
    icon: "sparkles-outline",
    title: "1. Introduction",
    content:
      'Welcome to TendherMom. This Privacy Policy describes how TENDHERMOM LTD ("the Company," "we," "us," or "our") collects, uses, and protects your information. By accessing or using the app, you agree to the data practices described in this policy in accordance with the Nigeria Data Protection Act (NDPA).',
  },
  {
    icon: "folder-open-outline",
    title: "2. Data Collection and Usage",
    items: [
      { bold: "Health Data:", text: "We collect pregnancy milestones and symptoms to provide health insights. This data is encrypted." },
      { bold: "Location Data:", text: "We track your real-time GPS location only for the Rescue Map and SOS features. This data is only shared with your 5 designated contacts when you trigger an alert." },
      { bold: "Contact Data:", text: "We access your contact list solely for you to select your 5 Emergency Contacts. We do not store your entire contact list." },
      { bold: "Inactivity Monitoring:", text: "We monitor app logins to trigger the Inactivity Alert to your partner if you are inactive for 48 hours." },
    ],
  },
  {
    icon: "lock-closed-outline",
    title: "3. Data Sharing & Security",
    content:
      "TENDHERMOM LTD does not sell your personal or health data. We only share payment data with Apple Pay and Google Pay to process subscriptions, and we only share location data with your designated contacts during an emergency. We use industry-standard encryption to protect all transmissions.",
  },
  {
    icon: "leaf-outline",
    title: "4. Evolving Our Services",
    content:
      "As we strive to provide the best possible support for your maternal journey, TENDHERMOM LTD may refine this Privacy Policy from time to time. The latest version will always be accessible here, and your continued use of TendherMom ensures that you are always benefiting from our most current privacy protections and service standards.",
  },
  {
    icon: "trash-outline",
    title: "5. Your Rights & Data Deletion",
    content:
      "You may delete your account at any time via the app settings. Upon account deletion, TENDHERMOM LTD wipes all associated health and location records from our active servers.",
  },
];

const Privacy = ({ onBack }: PrivacyProps = {}) => {
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
          <motion.button
            variants={fadeUp}
            whileTap={{ scale: 0.92 }}
            onClick={handleBack}
            className="flex items-center gap-1.5 mb-6"
          >
            <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--green))" }} />
            <span className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--green))" }}>Back</span>
          </motion.button>

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
                <IonIcon name="shield-checkmark" size={22} style={{ color: "hsl(var(--coral))" }} />
              </div>
            </div>
            <h1 className="text-white font-serif text-[26px] leading-tight tracking-[-0.01em]">
              Privacy Policy
            </h1>
            <p className="text-white/60 text-[12px] font-sans mt-2">Effective Date: April 28, 2026</p>
            <p className="text-white/50 text-[11px] font-sans mt-1">Data Controller: TENDHERMOM LTD</p>
          </motion.div>

          <div className="space-y-4">
            {sections.map((section, idx) => (
              <motion.div key={idx} variants={fadeUp} className="tend-card overflow-hidden">
                <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                  <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--light-green))" }}>
                    <IonIcon name={section.icon} size={18} style={{ color: "hsl(var(--green))" }} />
                  </div>
                  <h2 className="text-[15px] font-sans font-bold" style={{ color: "hsl(var(--dark))" }}>
                    {section.title}
                  </h2>
                </div>
                <div className="px-5 pb-5">
                  {section.content && (
                    <p className="text-[13px] font-sans leading-[1.7]" style={{ color: "hsl(var(--text-muted))" }}>
                      {section.content}
                    </p>
                  )}
                  {section.items && (
                    <div className="space-y-2 mt-1">
                      {section.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-[6px] h-[6px] rounded-full mt-[7px] flex-shrink-0"
                            style={{ background: "hsl(var(--green))" }} />
                          <p className="text-[13px] font-sans leading-[1.7]" style={{ color: "hsl(var(--text-muted))" }}>
                            {item.bold && <span className="font-semibold" style={{ color: "hsl(var(--dark))" }}>{item.bold} </span>}
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p variants={fadeUp} className="text-center text-[11px] font-sans mt-6" style={{ color: "hsl(var(--text-muted))" }}>
            © {new Date().getFullYear()} TENDHERMOM LTD. All rights reserved.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;

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
    icon: "folder-open-outline",
    title: "1. Information We Collect",
    content: "TendherMom collects the following personal information to provide maternal health support:",
    items: [
      { bold: "Account data:", text: "Name, email address, phone number" },
      { bold: "Health data:", text: "Last menstrual period (LMP) date, due date, pregnancy stage, triage symptom responses" },
      { bold: "Emergency contacts:", text: "Names, phone numbers, email addresses, and WhatsApp numbers of designated contacts" },
      { bold: "Community data:", text: "Posts, comments, and likes within trimester communities" },
      { bold: "Device data:", text: "Device type, OS version, and push notification tokens" },
      { bold: "Location data:", text: "Only when you trigger an SOS emergency alert (latitude/longitude)" },
    ],
  },
  {
    icon: "analytics-outline",
    title: "2. How We Use Your Information",
    items: [
      { text: "Provide personalized pregnancy tracking and health triage guidance" },
      { text: "Deliver SOS emergency alerts to your designated contacts" },
      { text: "Enable participation in trimester-specific community groups" },
      { text: "Send push notifications for health reminders and community activity" },
      { text: "Improve our services through aggregated, anonymized analytics" },
    ],
  },
  {
    icon: "share-social-outline",
    title: "3. Data Sharing",
    content: "We do not sell your personal data. We share information only with:",
    items: [
      { bold: "Your emergency contacts:", text: "When you trigger an SOS alert" },
      { bold: "Infrastructure providers:", text: "Secure cloud hosting and database services" },
      { bold: "Communication providers:", text: "SMS and WhatsApp delivery for emergency alerts" },
    ],
  },
  {
    icon: "lock-closed-outline",
    title: "4. Data Security",
    content: "All data is encrypted in transit (TLS 1.3) and at rest. Access is protected by row-level security policies ensuring users can only access their own data. Health information is never exposed to other users.",
  },
  {
    icon: "trash-outline",
    title: "5. Data Retention & Deletion",
    content: "Your data is retained for as long as your account is active. You can permanently delete your account and all associated data at any time from your Profile settings. Upon deletion, all personal data, posts, health records, and emergency contacts are immediately and irreversibly removed.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "6. Your Rights",
    content: "Under the Nigeria Data Protection Act (NDPA) 2023, you have the right to:",
    items: [
      { text: "Access your personal data" },
      { text: "Correct inaccurate information" },
      { text: "Delete your account and data" },
      { text: "Withdraw consent for data processing" },
      { text: "Object to automated decision-making" },
    ],
  },
  {
    icon: "people-outline",
    title: "7. Children's Privacy",
    content: "TendherMom is not intended for users under 16 years of age. We do not knowingly collect data from minors.",
  },
  {
    icon: "mail-outline",
    title: "8. Contact Us",
    content: "For privacy-related inquiries, contact us at privacy@tendhermom.com",
    email: "privacy@tendhermom.com",
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
                <IonIcon name="shield-checkmark" size={22} style={{ color: "hsl(var(--coral))" }} />
              </div>
            </div>
            <h1 className="text-white font-serif text-[26px] leading-tight tracking-[-0.01em]">
              Privacy Policy
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
              >
                {/* Section header */}
                <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                  <div
                    className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--light-green))" }}
                  >
                    <IonIcon name={section.icon} size={18} style={{ color: "hsl(var(--green))" }} />
                  </div>
                  <h2 className="text-[15px] font-sans font-bold" style={{ color: "hsl(var(--dark))" }}>
                    {section.title}
                  </h2>
                </div>

                {/* Section body */}
                <div className="px-5 pb-5">
                  {section.content && (
                    <p className="text-[13px] font-sans leading-[1.7] mb-2" style={{ color: "hsl(var(--text-muted))" }}>
                      {section.email ? (
                        <>For privacy-related inquiries, contact us at{" "}
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

          {/* Footer */}
          <motion.p variants={fadeUp} className="text-center text-[11px] font-sans mt-6" style={{ color: "hsl(var(--text-muted))" }}>
            © {new Date().getFullYear()} TendherMom. All rights reserved.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;

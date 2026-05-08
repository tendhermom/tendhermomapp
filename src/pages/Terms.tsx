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
    title: "1. Binding Agreement",
    content:
      "These Terms of Use constitute a legally binding agreement between you and TENDHERMOM LTD. By accessing or using TendherMom, you agree to be bound by these terms.",
  },
  {
    icon: "refresh-outline",
    title: "2. Service Evolution & Updates",
    content:
      "To ensure TendherMom remains a leading safety and support tool, TENDHERMOM LTD may update these Terms of Use to reflect new features, improved security, or regulatory changes. By continuing to enjoy the app's features and community, you accept the most current version of these Terms, ensuring a consistent and high-quality experience for all members of our community.",
  },
  {
    icon: "medkit-outline",
    title: "3. Medical & Emergency Disclaimer",
    highlight: true,
    items: [
      { bold: "No Medical Advice:", text: "TendherMom is an information tool, not a medical provider. TENDHERMOM LTD does not provide medical diagnoses. Always seek the advice of a physician." },
      { bold: "Emergency Limitations:", text: "The SOS and Rescue Map features rely on GPS and cellular networks. TENDHERMOM LTD is not liable for any failure, delay, or inaccuracy in these features due to network issues or third-party service failures." },
      { bold: "Assumption of Risk:", text: "You acknowledge that pregnancy involves inherent health risks. TENDHERMOM LTD is not liable for any medical complications, injuries, or fatalities occurring during the use of the app." },
    ],
  },
  {
    icon: "diamond-outline",
    title: "4. Premium Subscriptions",
    content:
      "Premium features (Inactivity Alert, Unlimited AI, Gift Button) require a subscription (₦300/week, ₦1,000/month, or ₦10,000/year). Payments are processed securely via Apple Pay for iOS users and Google Pay for Android users, subject to their respective privacy policies and terms. TENDHERMOM LTD does not store your payment card details and is not liable for payment failures, network errors, or unauthorized bank charges.",
  },
  {
    icon: "gift-outline",
    title: "5. Baby Shower Gift Button",
    items: [
      { bold: "Facilitation Only:", text: "TENDHERMOM LTD facilitates wishlist sharing but is not responsible for the delivery of physical gifts or the conduct of gift-givers." },
      { bold: "Non-Refundable:", text: "All financial gifts sent to users via TendherMom are final and non-refundable." },
      { bold: "Fees:", text: "You acknowledge that Apple Pay and Google Pay may deduct standard transaction fees from gifts received." },
    ],
  },
  {
    icon: "shield-outline",
    title: "6. Indemnification",
    content:
      "You agree to defend and hold harmless TENDHERMOM LTD, its directors, and employees from any claims, suits, or damages (including legal fees) arising from your use of the app or violation of these terms.",
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
                <IonIcon name="document-text" size={22} style={{ color: "hsl(var(--coral))" }} />
              </div>
            </div>
            <h1 className="text-white font-serif text-[26px] leading-tight tracking-[-0.01em]">Terms of Use</h1>
            <p className="text-white/60 text-[12px] font-sans mt-2">Last Updated: April 28, 2026</p>
            <p className="text-white/50 text-[11px] font-sans mt-1">TENDHERMOM LTD</p>
          </motion.div>

          <div className="space-y-4">
            {sections.map((section, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                className="tend-card overflow-hidden"
                style={section.highlight ? { borderLeft: "3px solid hsl(var(--coral))" } : undefined}
              >
                <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                  <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: section.highlight ? "hsl(var(--light-coral))" : "hsl(var(--light-green))" }}>
                    <IonIcon name={section.icon} size={18} style={{ color: section.highlight ? "hsl(var(--coral))" : "hsl(var(--green))" }} />
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
                            style={{ background: section.highlight ? "hsl(var(--coral))" : "hsl(var(--green))" }} />
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

export default Terms;

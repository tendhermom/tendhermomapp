import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { hapticLight } from "@/lib/despia";

interface HelpSupportScreenProps {
  onBack: () => void;
}

const SUPPORT_EMAIL_PRIMARY = "support@tendhermom.com";
const SUPPORT_EMAIL_SECONDARY = "tendhermom@gmail.com";
const SUPPORT_PHONE_DISPLAY = "+234 810 536 4446";
const SUPPORT_PHONE_TEL = "+2348105364446";
const WHATSAPP_NUMBER = "2348105364446";

const faqs = [
  {
    q: "How do I trigger an SOS alert?",
    a: "Open the SOS tab and hold the red emergency button. Your saved emergency contacts will receive your live location instantly via SMS.",
  },
  {
    q: "How do I upgrade to TendherMom Plus?",
    a: "Go to Profile → TendherMom Plus and choose a Weekly, Monthly, or Yearly plan. Subscriptions renew automatically and can be cancelled in your device store settings.",
  },
  {
    q: "How is my pregnancy week calculated?",
    a: "We calculate your current week from the Last Menstrual Period (LMP) you entered during onboarding. You can update it anytime from Edit Profile.",
  },
  {
    q: "Is my health data private?",
    a: "Yes. All entries are encrypted in transit and protected by row-level security. Only you can see your records.",
  },
  {
    q: "How do I delete my account?",
    a: "Profile → Delete Account. This permanently removes your profile, posts, emergency contacts, and all associated data.",
  },
];

const HelpSupportScreen = ({ onBack }: HelpSupportScreenProps) => {
  const openMail = (email: string) => {
    hapticLight();
    window.location.href = `mailto:${email}?subject=TendherMom%20Support%20Request`;
  };

  const openTel = () => {
    hapticLight();
    window.location.href = `tel:${SUPPORT_PHONE_TEL}`;
  };

  const openWhatsApp = () => {
    hapticLight();
    window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      "Hi TendherMom team, I need help with…",
    )}`;
  };

  return (
    <div className="space-y-6 pb-8 pt-1">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-1">
          <IonIcon name="chevron-back-outline" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>
          Help & Support
        </h1>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.05 }}
        className="hero-card p-5"
      >
        <div className="relative z-10">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <IonIcon name="headset-outline" size={26} style={{ color: "white" }} />
          </div>
          <h2 className="text-white text-[20px] font-serif leading-tight">We're here to help</h2>
          <p className="text-white/70 text-[13px] font-sans mt-1.5 leading-relaxed">
            Reach our care team any day of the week. We typically reply within a few hours.
          </p>
        </div>
      </motion.div>

      {/* Contact channels */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.12 }}
        className="space-y-3"
      >
        <p className="label-caps px-1" style={{ color: "hsl(var(--text-muted))" }}>
          Contact us
        </p>

        {/* Primary email */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => openMail(SUPPORT_EMAIL_PRIMARY)}
          className="tend-card w-full px-[18px] py-4 flex items-center gap-3.5 text-left"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--green) / 0.1)" }}
          >
            <IonIcon name="mail-outline" size={20} style={{ color: "hsl(var(--green))" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              Support email
            </p>
            <p className="text-[15px] font-semibold font-sans truncate" style={{ color: "hsl(var(--dark))" }}>
              {SUPPORT_EMAIL_PRIMARY}
            </p>
          </div>
          <IonIcon name="chevron-forward" size={16} style={{ color: "hsl(var(--border))" }} />
        </motion.button>

        {/* Secondary email */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => openMail(SUPPORT_EMAIL_SECONDARY)}
          className="tend-card w-full px-[18px] py-4 flex items-center gap-3.5 text-left"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--green) / 0.1)" }}
          >
            <IonIcon name="mail-open-outline" size={20} style={{ color: "hsl(var(--green))" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              General inquiries
            </p>
            <p className="text-[15px] font-semibold font-sans truncate" style={{ color: "hsl(var(--dark))" }}>
              {SUPPORT_EMAIL_SECONDARY}
            </p>
          </div>
          <IonIcon name="chevron-forward" size={16} style={{ color: "hsl(var(--border))" }} />
        </motion.button>

        {/* Phone */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={openTel}
          className="tend-card w-full px-[18px] py-4 flex items-center gap-3.5 text-left"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--coral) / 0.12)" }}
          >
            <IonIcon name="call-outline" size={20} style={{ color: "hsl(var(--coral))" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              Call us
            </p>
            <p className="text-[15px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
              {SUPPORT_PHONE_DISPLAY}
            </p>
          </div>
          <IonIcon name="chevron-forward" size={16} style={{ color: "hsl(var(--border))" }} />
        </motion.button>

        {/* WhatsApp */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={openWhatsApp}
          className="tend-card w-full px-[18px] py-4 flex items-center gap-3.5 text-left"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--green) / 0.12)" }}
          >
            <IonIcon name="logo-whatsapp" size={20} style={{ color: "hsl(var(--green))" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              Chat on WhatsApp
            </p>
            <p className="text-[15px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
              {SUPPORT_PHONE_DISPLAY}
            </p>
          </div>
          <IonIcon name="chevron-forward" size={16} style={{ color: "hsl(var(--border))" }} />
        </motion.button>
      </motion.div>

      {/* FAQs */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.2 }}
        className="space-y-3"
      >
        <p className="label-caps px-1" style={{ color: "hsl(var(--text-muted))" }}>
          Frequently asked
        </p>
        <div className="tend-card overflow-hidden">
          {faqs.map((faq, i) => (
            <details
              key={faq.q}
              className="group"
              style={{
                borderBottom: i < faqs.length - 1 ? "0.5px solid hsl(var(--border))" : "none",
              }}
            >
              <summary
                className="flex items-center gap-3 px-[18px] py-[15px] cursor-pointer list-none"
                onClick={() => hapticLight()}
              >
                <span
                  className="flex-1 text-[14px] font-medium font-sans"
                  style={{ color: "hsl(var(--dark))" }}
                >
                  {faq.q}
                </span>
                <IonIcon
                  name="chevron-down"
                  size={16}
                  style={{ color: "hsl(var(--text-muted))" }}
                />
              </summary>
              <div className="px-[18px] pb-[15px] -mt-1">
                <p
                  className="text-[13.5px] font-sans leading-relaxed"
                  style={{ color: "hsl(var(--text-muted))" }}
                >
                  {faq.a}
                </p>
              </div>
            </details>
          ))}
        </div>
      </motion.div>

      {/* Emergency notice */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.28 }}
        className="tend-card p-4 flex gap-3"
        style={{ background: "hsl(var(--coral) / 0.08)" }}
      >
        <IonIcon
          name="information-circle-outline"
          size={20}
          style={{ color: "hsl(var(--coral))", flexShrink: 0, marginTop: 2 }}
        />
        <p className="text-[12.5px] font-sans leading-relaxed" style={{ color: "hsl(var(--dark))" }}>
          For medical emergencies, please use the SOS tab or call your nearest hospital. Our support
          team cannot provide medical advice.
        </p>
      </motion.div>

      <p className="text-center text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
        TendherMom Support · Mon–Sun, 8am–10pm WAT
      </p>
    </div>
  );
};

export default HelpSupportScreen;

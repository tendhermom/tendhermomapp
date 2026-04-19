import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import IonIcon from "@/components/IonIcon";
import { hapticLight } from "@/lib/despia";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { Sentry } from "@/lib/sentry";

interface HelpSupportScreenProps {
  onBack: () => void;
}

const SUPPORT_EMAIL_PRIMARY = "support@tendhermom.com";
const SUPPORT_EMAIL_SECONDARY = "tendhermom@gmail.com";
const SUPPORT_PHONE_DISPLAY = "+234 810 536 4446";
const SUPPORT_PHONE_TEL = "+2348105364446";
const WHATSAPP_NUMBER = "2348105364446";

const CATEGORIES = [
  "General",
  "Billing & Plus",
  "Account",
  "Health Tracker",
  "Community",
  "SOS / Emergency",
  "Bug report",
];

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
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openMail = (addr: string) => {
    hapticLight();
    window.location.href = `mailto:${addr}?subject=TendherMom%20Support%20Request`;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    const trimmedSubject = subject.trim();

    if (trimmedName.length < 2) {
      toast.error("Please enter your name");
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(trimmedEmail)) {
      toast.error("Please enter a valid email");
      return;
    }
    if (trimmedMessage.length < 10) {
      toast.error("Message must be at least 10 characters");
      return;
    }

    hapticLight();
    setSubmitting(true);
    Sentry.addBreadcrumb({
      category: "support",
      level: "info",
      message: "ticket-submit",
      data: { category, hasSubject: !!trimmedSubject, messageLength: trimmedMessage.length },
    });
    try {
      const { error } = await supabase.functions.invoke("send-support-ticket", {
        body: {
          name: trimmedName,
          email: trimmedEmail,
          subject: trimmedSubject || `${category} request`,
          message: trimmedMessage,
          category,
        },
      });
      if (error) throw error;
      toast.success("Message sent! We'll reply within a few hours.");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error("Support ticket error:", err);
      Sentry.captureException(err, { tags: { feature: "support-ticket" }, extra: { category } });
      toast.error("Could not send message. Please try email or WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "white",
    border: "0.5px solid hsl(var(--border))",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 15,
    color: "hsl(var(--dark))",
    width: "100%",
    fontFamily: "inherit",
    outline: "none",
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

      {/* Contact form */}
      <motion.form
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.18 }}
        onSubmit={handleSubmit}
        className="space-y-3"
      >
        <p className="label-caps px-1" style={{ color: "hsl(var(--text-muted))" }}>
          Send us a message
        </p>
        <div className="tend-card p-4 space-y-3">
          <div>
            <label className="text-[12.5px] font-sans block mb-1.5" style={{ color: "hsl(var(--text-muted))" }}>
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              maxLength={100}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label className="text-[12.5px] font-sans block mb-1.5" style={{ color: "hsl(var(--text-muted))" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={255}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label className="text-[12.5px] font-sans block mb-1.5" style={{ color: "hsl(var(--text-muted))" }}>
              Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => { hapticLight(); setCategory(e.target.value); }}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  WebkitAppearance: "none",
                  paddingRight: 38,
                  cursor: "pointer",
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              >
                <IonIcon name="chevron-down" size={16} style={{ color: "hsl(var(--text-muted))" }} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[12.5px] font-sans block mb-1.5" style={{ color: "hsl(var(--text-muted))" }}>
              Subject (optional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary"
              maxLength={200}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-[12.5px] font-sans block mb-1.5" style={{ color: "hsl(var(--text-muted))" }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us how we can help…"
              maxLength={4000}
              rows={5}
              style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
              required
            />
            <p className="text-[11px] font-sans mt-1 text-right" style={{ color: "hsl(var(--text-muted))" }}>
              {message.length}/4000
            </p>
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={submitting}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-[15px] font-sans"
            style={{
              background: submitting ? "hsl(var(--green) / 0.5)" : "hsl(var(--green))",
              color: "white",
            }}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <IonIcon name="send" size={16} style={{ color: "white" }} />
                Send message
              </>
            )}
          </motion.button>
        </div>
      </motion.form>

      {/* FAQs */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.22 }}
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

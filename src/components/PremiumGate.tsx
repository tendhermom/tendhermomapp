import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";

// Preview images
import babyShower1 from "@/assets/previews/baby-shower-1.jpg";
import babyShower2 from "@/assets/previews/baby-shower-2.jpg";
import healthHubs1 from "@/assets/hubs/maternal.jpg";
import healthHubs2 from "@/assets/hubs/diagnostics.jpg";
import aiChat1 from "@/assets/previews/ai-chat-1.jpg";
import aiChat2 from "@/assets/previews/ai-chat-2.jpg";
import sosContacts1 from "@/assets/previews/sos-contacts-1.jpg";
import sosContacts2 from "@/assets/previews/sos-contacts-2.jpg";

interface PreviewSlide {
  image: string;
  title: string;
  description: string;
}

const FEATURE_PREVIEWS: Record<string, PreviewSlide[]> = {
  "Baby Shower": [
    { image: babyShower1, title: "Celebrate Your Baby", description: "Share beautiful announcements with the TendherMom community" },
    { image: babyShower2, title: "Receive Digital Gifts", description: "Friends & family can send gifts and congratulations" },
  ],
  "Health Hubs": [
    { image: healthHubs1, title: "Care Near You", description: "Browse trusted maternal, pediatric, emergency, and diagnostic facilities nearby." },
    { image: healthHubs2, title: "Search With Confidence", description: "Compare services, directions, and location-based options faster with Health Hubs." },
  ],
  "Unlimited AI Chat": [
    { image: aiChat1, title: "24/7 Health Assistant", description: "Get instant answers to pregnancy health questions" },
    { image: aiChat2, title: "Personalised Guidance", description: "Nutrition tips with African dietary options included" },
  ],
  "5 Emergency Contacts": [
    { image: sosContacts1, title: "Full SOS Protection", description: "Add up to 5 emergency contacts for instant alerts" },
    { image: sosContacts2, title: "Multi-Channel Alerts", description: "SMS, WhatsApp & email — all channels at once" },
  ],
};

// Feature benefits shown as chips
const FEATURE_BENEFITS: Record<string, string[]> = {
  "Baby Shower": ["Create Posts", "Enable Gifts", "Community Love"],
  "Health Hubs": ["Smart Directory", "GPS Location", "All Categories"],
  "Unlimited AI Chat": ["No Weekly Limit", "Nutrition Tips", "Symptom Guidance"],
  "5 Emergency Contacts": ["5 Contacts", "SMS + WhatsApp", "GPS Tracking"],
};

interface PremiumGateProps {
  feature: string;
  description?: string;
  onUpgrade: () => void;
}

const PremiumGate = ({ feature, description, onUpgrade }: PremiumGateProps) => {
  const slides = FEATURE_PREVIEWS[feature] || [];
  const benefits = FEATURE_BENEFITS[feature] || [];
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-rotate carousel
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setActiveSlide(index);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="space-y-5"
    >
      {/* Preview Carousel */}
      {slides.length > 0 && (
        <div className="relative rounded-[20px] overflow-hidden" style={{ boxShadow: "0 8px 32px -8px hsla(0,0%,0%,0.12)" }}>
          <div className="relative" style={{ aspectRatio: "5/4" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <img
                  src={slides[activeSlide].image}
                  alt={slides[activeSlide].title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={640}
                  height={512}
                />
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to top, hsla(var(--dark), 0.85) 0%, hsla(var(--dark), 0.3) 40%, transparent 70%)",
                  }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Slide content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-white text-[18px] font-serif leading-tight">
                    {slides[activeSlide].title}
                  </h3>
                  <p className="text-white/70 text-[12px] font-sans mt-1 leading-relaxed">
                    {slides[activeSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Dots indicator */}
              {slides.length > 1 && (
                <div className="flex gap-1.5 mt-3">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      className="h-[3px] rounded-full transition-all duration-300"
                      style={{
                        width: i === activeSlide ? 20 : 8,
                        background: i === activeSlide ? "hsl(var(--coral))" : "rgba(255,255,255,0.3)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Premium badge */}
            <div className="absolute top-3 right-3 z-10">
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold tracking-wide"
                style={{
                  background: "hsla(0,0%,0%,0.4)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  color: "hsl(var(--coral))",
                }}
              >
                <IonIcon name="diamond" size={10} style={{ color: "hsl(var(--coral))" }} />
                PLUS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Benefits chips */}
      {benefits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2 justify-center"
        >
          {benefits.map((benefit, i) => (
            <motion.span
              key={benefit}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-sans font-semibold"
              style={{
                background: "hsl(var(--light-green))",
                color: "hsl(var(--green))",
              }}
            >
              <IonIcon name="checkmark-circle" size={12} style={{ color: "hsl(var(--green))" }} />
              {benefit}
            </motion.span>
          ))}
        </motion.div>
      )}

      {/* Lock card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-[18px] p-5 text-center"
        style={{
          background: "linear-gradient(135deg, hsla(var(--green), 0.06), hsla(var(--coral), 0.06))",
          border: "1px solid hsla(var(--green), 0.12)",
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{
            background: "linear-gradient(135deg, hsl(var(--light-coral)), hsl(var(--light-green)))",
          }}
        >
          <IonIcon name="lock-closed" size={22} style={{ color: "hsl(var(--coral))" }} />
        </div>
        <h3 className="text-[16px] font-serif mb-1" style={{ color: "hsl(var(--dark))" }}>
          Unlock {feature}
        </h3>
        <p className="text-[12px] font-sans max-w-[260px] mx-auto mb-4" style={{ color: "hsl(var(--text-muted))" }}>
          {description || `${feature} is available for TendherMom Plus members. Upgrade to get full access.`}
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onUpgrade}
          className="w-full max-w-[280px] flex items-center justify-center gap-2 px-6 py-[14px] rounded-2xl text-[15px] font-sans font-bold mx-auto ios-press"
          style={{
            background: "linear-gradient(135deg, hsl(var(--coral)), hsl(11 74% 52%))",
            color: "white",
            boxShadow: "0 8px 28px -6px hsla(11, 74%, 56%, 0.5)",
          }}
        >
          <IonIcon name="lock-open-outline" size={18} style={{ color: "white" }} />
          Unlock Plus
        </motion.button>

        {/* Price hint */}
        <p className="text-[10px] font-sans mt-3" style={{ color: "hsl(var(--text-muted))" }}>
          Starting from <span className="font-semibold" style={{ color: "hsl(var(--green))" }}>₦300/week</span>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default PremiumGate;

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import IonIcon from "@/components/IonIcon";

import introDashboard from "@/assets/intro-dashboard.png";
import introCommunity from "@/assets/intro-community.png";
import introSos from "@/assets/intro-sos.png";

interface IntroScreenProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    image: introDashboard,
    title: "Your Pregnancy Dashboard,",
    titleAccent: "Tailored for You",
    subtitle: "Monitor your health & connect with doctors for trusted support",
    features: [
      { icon: "pulse-outline", label: "Personalized health updates" },
      { icon: "grid-outline", label: "Quick access to vital features" },
      { icon: "flag-outline", label: "Designed for mothers in Nigeria" },
    ],
    accentColor: "hsl(var(--green))",
  },
  {
    image: introCommunity,
    title: "Join Supportive",
    titleAccent: "Pregnancy Communities",
    subtitle: "Connect with other mothers through every stage",
    features: [
      { icon: "chatbubbles-outline", label: "Find reassuring advice" },
      { icon: "people-outline", label: "Share experiences & tips" },
      { icon: "flag-outline", label: "Made for mothers in Nigeria" },
    ],
    accentColor: "hsl(var(--green))",
  },
  {
    image: introSos,
    title: "In Urgent Need",
    titleAccent: "of Help?",
    subtitle: "Reach out to your loved ones with a single tap",
    features: [
      { icon: "alert-circle-outline", label: "Fast SOS alert" },
      { icon: "chatbox-ellipses-outline", label: "Instant contact messages" },
      { icon: "flag-outline", label: "Made for mothers in Nigeria" },
    ],
    accentColor: "hsl(var(--coral))",
  },
];

const SWIPE_THRESHOLD = 50;

const IntroScreen = ({ onComplete }: IntroScreenProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((index: number, dir: number) => {
    if (index < 0 || index >= SLIDES.length) return;
    setDirection(dir);
    setCurrent(index);
  }, []);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      if (info.offset.x < -SWIPE_THRESHOLD && current < SLIDES.length - 1) {
        goTo(current + 1, 1);
      } else if (info.offset.x > SWIPE_THRESHOLD && current > 0) {
        goTo(current - 1, -1);
      }
    },
    [current, goTo]
  );

  const handleGetStarted = useCallback(() => {
    localStorage.setItem("intro_completed", "true");
    onComplete();
  }, [onComplete]);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const slideVariants = {
    enter: (d: number) => ({
      x: d > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.92,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.92,
    }),
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col overflow-hidden"
      style={{ background: "hsl(var(--bg))" }}
      ref={containerRef}
    >
      {/* Skip button */}
      {!isLast && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleGetStarted}
          className="absolute top-0 right-0 z-20 px-5 text-[13px] font-sans font-medium"
          style={{
            color: "hsl(var(--text-muted))",
            paddingTop: "calc(var(--safe-area-top, 0px) + 16px)",
          }}
        >
          Skip
        </motion.button>
      )}

      {/* Main swipeable area */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.8 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex flex-col items-center justify-center px-8 cursor-grab active:cursor-grabbing"
          >
            {/* Floating illustration */}
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.85 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.1 }}
              className="relative mb-6"
            >
              {/* Soft glow behind image */}
              <div
                className="absolute inset-0 rounded-full blur-[60px] opacity-30"
                style={{
                  background: `radial-gradient(circle, ${slide.accentColor}, transparent 70%)`,
                  transform: "scale(1.3)",
                }}
              />
              <img
                src={slide.image}
                alt=""
                className="relative w-[220px] h-[220px] object-contain drop-shadow-lg"
                draggable={false}
              />
              {/* Floating sparkle particles */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    background: slide.accentColor,
                    top: `${20 + i * 30}%`,
                    left: i % 2 === 0 ? "-8%" : "95%",
                    opacity: 0.5,
                  }}
                  animate={{
                    y: [0, -12, 0],
                    opacity: [0.3, 0.7, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 2.5 + i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.4,
                  }}
                />
              ))}
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 250, damping: 25 }}
              className="text-center mb-3"
            >
              <h1
                className="font-serif text-[28px] leading-[1.15] tracking-[-0.01em]"
                style={{ color: "hsl(var(--dark))" }}
              >
                {slide.title}
                <br />
                <span style={{ color: slide.accentColor }}>{slide.titleAccent}</span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 250, damping: 25 }}
              className="text-[14px] font-sans leading-relaxed text-center max-w-[280px] mb-8"
              style={{ color: "hsl(var(--text-muted))" }}
            >
              {slide.subtitle}
            </motion.p>

            {/* Feature pills */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 250, damping: 25 }}
              className="flex flex-wrap justify-center gap-2.5 max-w-[340px]"
            >
              {slide.features.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 + i * 0.08, type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    background: "hsl(var(--surface))",
                    boxShadow: "0 2px 12px -2px hsla(var(--dark), 0.06)",
                  }}
                >
                  <IonIcon name={f.icon} size={14} style={{ color: slide.accentColor }} />
                  <span
                    className="text-[11px] font-sans font-medium whitespace-nowrap"
                    style={{ color: "hsl(var(--dark))" }}
                  >
                    {f.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom area: dots + button */}
      <div
        className="shrink-0 px-8 pb-4 flex flex-col items-center gap-6"
        style={{ paddingBottom: "calc(var(--safe-area-bottom, 0px) + 16px)" }}
      >
        {/* Progress dots */}
        <div className="flex items-center gap-2.5">
          {SLIDES.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              animate={{
                width: i === current ? 28 : 8,
                background:
                  i === current ? "hsl(var(--green))" : "hsl(var(--border-subtle))",
              }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="h-[8px] rounded-full"
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Action button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={isLast ? handleGetStarted : () => goTo(current + 1, 1)}
          className="w-full max-w-[340px] py-[16px] rounded-2xl text-[16px] font-semibold font-sans flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 22%))",
            color: "white",
            boxShadow: "0 6px 24px -6px hsla(153,42%,30%,0.45)",
          }}
        >
          {isLast ? (
            <>
              Get Started
              <IonIcon name="arrow-forward" size={18} style={{ color: "white" }} />
            </>
          ) : (
            "Continue"
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default IntroScreen;

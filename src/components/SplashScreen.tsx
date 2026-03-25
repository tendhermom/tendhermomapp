import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.jpeg";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 700);
    }, 2400);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "hsl(var(--bg))" }}
        >
          {/* Radial glow behind logo */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 280,
              height: 280,
              background: "radial-gradient(circle, hsla(var(--green), 0.12) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [1, 1.15, 1], opacity: [0, 0.8, 0.6] }}
            transition={{
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 1, ease: "easeOut" },
            }}
          />

          {/* Floating sparkle particles */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 4 + i * 1.5,
                height: 4 + i * 1.5,
                background: i % 2 === 0 ? "hsl(var(--green))" : "hsl(var(--coral))",
                top: `${35 + i * 8}%`,
                left: `${25 + i * 15}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.5, 0.2, 0.5, 0],
                scale: [0.5, 1.2, 0.8, 1.1, 0.5],
                y: [0, -16, 0, 12, 0],
              }}
              transition={{
                duration: 3 + i * 0.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6 + i * 0.3,
              }}
            />
          ))}

          {/* Logo container with premium shadow */}
          <motion.div
            className="relative"
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 18,
              delay: 0.15,
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-[28px]"
              style={{
                boxShadow: "0 20px 60px -15px hsla(var(--green), 0.25), 0 8px 24px -8px hsla(var(--dark), 0.1)",
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <img
              src={logo}
              alt="TendherMom"
              className="relative w-[120px] h-[120px] rounded-[28px] object-contain"
            />
          </motion.div>

          {/* Brand name with staggered reveal */}
          <motion.h1
            className="mt-7 font-serif text-[22px] tracking-[-0.01em]"
            style={{ color: "hsl(var(--dark))" }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 22 }}
          >
            Tendher
            <span style={{ color: "hsl(var(--green))" }}>Mom</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="mt-2 text-[13px] font-sans tracking-wide"
            style={{ color: "hsl(var(--text-muted))" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.5, ease: "easeOut" }}
          >
            Your pregnancy companion
          </motion.p>

          {/* Subtle loading bar */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 flex justify-center"
            style={{ paddingBottom: "calc(var(--safe-area-bottom, 0px) + 48px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div
              className="h-[3px] w-16 rounded-full overflow-hidden"
              style={{ background: "hsl(var(--border-subtle))" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(var(--green)), hsl(var(--coral)))" }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 1, duration: 1.3, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;

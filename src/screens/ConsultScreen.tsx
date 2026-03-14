import { useState } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import DoctorCard from "@/components/cards/DoctorCard";
import PremiumUpsell from "@/components/cards/PremiumUpsell";
import TopBar from "@/components/navigation/TopBar";
import BookingSheet from "@/components/BookingSheet";

interface ConsultScreenProps {
  onNavigate: (tab: string) => void;
}

const specialties = ["All", "OB-GYN", "Midwife", "Nutritionist", "Therapist"];

const doctors = [
  {
    name: "Dr. Adaeze Nwosu",
    initials: "AN",
    specialty: "OB-GYN",
    rating: 4.9,
    experience: "12 years",
    available: true,
    fee: "₦15,000",
  },
  {
    name: "Dr. Funke Adeyemi",
    initials: "FA",
    specialty: "Midwife",
    rating: 4.8,
    experience: "8 years",
    available: true,
    fee: "₦8,000",
  },
  {
    name: "Dr. Bola Ogundimu",
    initials: "BO",
    specialty: "Nutritionist",
    rating: 4.7,
    experience: "6 years",
    available: false,
    fee: "₦10,000",
  },
];

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const ConsultScreen = ({ onNavigate }: ConsultScreenProps) => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [bookingDoctor, setBookingDoctor] = useState<typeof doctors[0] | null>(null);

  const filtered =
    activeFilter === "All"
      ? doctors
      : doctors.filter((d) => d.specialty === activeFilter);

  return (
    <motion.div
      className="space-y-6 pb-4"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <TopBar
          onProfilePress={() => onNavigate("profile")}
          onAIChatPress={() => onNavigate("ai-chat")}
        />
      </motion.div>

      {/* Title */}
      <motion.div variants={fadeUp}>
        <h1 className="font-serif text-dark" style={{ fontSize: "26px" }}>Consultations</h1>
        <p className="text-text-muted text-[13px] font-sans">Book with specialists</p>
      </motion.div>

      {/* Next appointment hero */}
      <motion.div variants={fadeUp}>
        <motion.div whileTap={{ scale: 0.98 }} className="hero-card p-5">
          <div className="relative z-10">
            <span className="label-caps" style={{ color: "rgba(255,255,255,0.5)" }}>
              Next Appointment
            </span>
            <h3 className="text-white text-[20px] font-serif mt-2">Dr. Adaeze Nwosu</h3>
            <p className="text-white/60 text-[13px] font-sans mt-1">Today, 2:30 PM</p>
            <div className="flex gap-2 mt-4">
              <motion.button
                whileTap={{ scale: 0.94 }}
                className="flex items-center gap-1.5 px-4 py-[10px] rounded-2xl"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <IonIcon name="videocam" size={16} style={{ color: "white" }} />
                <span className="text-white text-[13px] font-semibold font-sans">Join Call</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.94 }}
                className="flex items-center gap-1.5 px-4 py-[10px] rounded-2xl"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <IonIcon name="chatbubble-outline" size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
                <span className="text-white/70 text-[13px] font-medium font-sans">Message</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Specialty filters */}
      <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto hide-scrollbar -mx-5 px-5">
        {specialties.map((spec) => (
          <motion.button
            key={spec}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(spec)}
            className="text-[13px] font-semibold font-sans px-4 py-[9px] rounded-full flex-shrink-0 transition-all duration-200"
            style={{
              background: activeFilter === spec
                ? "hsl(var(--green))"
                : "hsl(var(--surface))",
              color: activeFilter === spec
                ? "white"
                : "hsl(var(--text-muted))",
              boxShadow: activeFilter === spec
                ? "none"
                : "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            {spec}
          </motion.button>
        ))}
      </motion.div>

      {/* Doctors */}
      <div className="space-y-3">
        {filtered.map((doc, i) => (
          <motion.div
            key={doc.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08, type: "spring" as const, stiffness: 300, damping: 30 }}
          >
            <DoctorCard {...doc} onBook={() => setBookingDoctor(doc)} />
          </motion.div>
        ))}
      </div>

      <motion.div variants={fadeUp}>
        <PremiumUpsell
          title="Unlock AI Health Chat"
          description="Get instant answers to your pregnancy questions powered by AI."
          ctaText="Try Premium"
          onAction={() => onNavigate("premium")}
        />
      </motion.div>

      {/* Booking sheet */}
      {bookingDoctor && (
        <BookingSheet
          doctor={bookingDoctor}
          isOpen={!!bookingDoctor}
          onClose={() => setBookingDoctor(null)}
        />
      )}
    </motion.div>
  );
};

export default ConsultScreen;

import { useState } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import DoctorCard from "@/components/cards/DoctorCard";
import PremiumUpsell from "@/components/cards/PremiumUpsell";

const specialties = ["All", "OB-GYN", "Midwife", "Nutritionist", "Therapist"];

const doctors = [
  {
    name: "Dr. Adaeze Nwosu",
    initials: "AN",
    specialty: "OB-GYN",
    rating: 4.8,
    experience: "10 years",
    available: true,
    fee: "₦15,000",
  },
  {
    name: "Dr. Funke Adeyemi",
    initials: "FA",
    specialty: "Midwife",
    rating: 4.9,
    experience: "8 years",
    available: true,
    fee: "₦10,000",
  },
  {
    name: "Dr. Ngozi Eze",
    initials: "NE",
    specialty: "Nutritionist",
    rating: 4.7,
    experience: "6 years",
    available: false,
    fee: "₦8,000",
  },
];

const ConsultScreen = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered =
    activeFilter === "All"
      ? doctors
      : doctors.filter((d) => d.specialty === activeFilter);

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div>
        <h1 className="ios-large-title text-foreground" style={{ fontSize: "28px" }}>
          Consult
        </h1>
        <p className="ios-footnote text-muted-foreground mt-1">
          Book appointments with specialists
        </p>
      </div>

      {/* Next appointment banner */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="rounded-2xl p-4 flex items-center justify-between relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(153, 42%, 30%), hsl(153, 42%, 24%))",
        }}
      >
        <div className="relative z-10">
          <p className="ios-caption font-semibold uppercase tracking-wider" style={{ color: "hsla(0,0%,100%,0.6)" }}>
            Next Appointment
          </p>
          <h4 className="ios-title mt-1.5" style={{ color: "white" }}>
            Dr. Adaeze Nwosu
          </h4>
          <p className="ios-footnote mt-0.5" style={{ color: "hsla(0,0%,100%,0.7)" }}>
            Today, 2:30 PM
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex items-center gap-1.5 px-4 py-[10px] rounded-xl relative z-10"
          style={{
            background: "hsla(0, 0%, 100%, 0.2)",
            backdropFilter: "blur(10px)",
          }}
        >
          <IonIcon name="videocam" size={18} style={{ color: "white" }} />
          <span className="ios-footnote font-semibold" style={{ color: "white" }}>Join</span>
        </motion.button>
      </motion.div>

      {/* Specialty filters - iOS segmented style */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
        {specialties.map((spec) => (
          <motion.button
            key={spec}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(spec)}
            className="ios-footnote font-semibold px-4 py-[8px] rounded-full flex-shrink-0 transition-all duration-200"
            style={{
              background: activeFilter === spec
                ? "hsl(var(--forest))"
                : "hsl(var(--ios-grouped-bg))",
              color: activeFilter === spec
                ? "white"
                : "hsl(var(--text-secondary))",
            }}
          >
            {spec}
          </motion.button>
        ))}
      </div>

      {/* Doctor cards */}
      <div className="space-y-3">
        {filtered.map((doc, i) => (
          <DoctorCard key={i} {...doc} />
        ))}
      </div>

      <PremiumUpsell
        title="Unlock AI Health Chat"
        description="Get instant answers to your pregnancy questions powered by AI."
        ctaText="Try Premium"
      />
    </div>
  );
};

export default ConsultScreen;

import { useState } from "react";
import { motion } from "framer-motion";
import { Video } from "lucide-react";
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
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Consult</h2>
        <p className="text-sm text-muted-foreground">
          Book appointments with specialists
        </p>
      </div>

      {/* Next appointment banner */}
      <div className="bg-primary rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium text-primary-foreground/70 uppercase tracking-wide">
            Next Appointment
          </p>
          <h4 className="text-sm font-semibold text-primary-foreground mt-1">
            Dr. Adaeze Nwosu
          </h4>
          <p className="text-xs text-primary-foreground/70 mt-0.5">
            Today, 2:30 PM
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="bg-primary-foreground/20 text-primary-foreground text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5"
        >
          <Video size={14} />
          Join
        </motion.button>
      </div>

      {/* Specialty filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-5 px-5">
        {specialties.map((spec) => (
          <motion.button
            key={spec}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(spec)}
            className={`text-xs font-medium px-4 py-2 rounded-full flex-shrink-0 transition-colors ${
              activeFilter === spec
                ? "bg-primary text-primary-foreground"
                : "bg-card card-shadow text-foreground"
            }`}
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

import { useState } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";

interface AppointmentsScreenProps {
  onBack: () => void;
}

const MOCK_DOCTORS = [
  { id: "1", name: "Dr. Adebayo Okonkwo", specialty: "Obstetrician", available: ["Mon 9am", "Wed 2pm", "Fri 10am"], avatar: "A" },
  { id: "2", name: "Dr. Ngozi Eze", specialty: "Gynaecologist", available: ["Tue 11am", "Thu 3pm"], avatar: "N" },
  { id: "3", name: "Dr. Funke Adeyemi", specialty: "Midwife Specialist", available: ["Mon 1pm", "Wed 10am", "Fri 2pm"], avatar: "F" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const AppointmentsScreen = ({ onBack }: AppointmentsScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan_type === "premium";
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  if (!isPremium) {
    return (
      <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <button onClick={onBack} className="ios-press">
            <IonIcon name="arrow-back" size={22} style={{ color: "hsl(var(--dark))" }} />
          </button>
          <h1 className="text-[24px] font-serif" style={{ color: "hsl(var(--dark))" }}>Appointments</h1>
        </motion.div>
        <motion.div variants={fadeUp} className="flex flex-col items-center text-center py-12">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: "hsl(var(--light-coral))" }}>
            <IonIcon name="lock-closed-outline" size={32} style={{ color: "hsl(var(--coral))" }} />
          </div>
          <h2 className="text-[20px] font-serif mb-2" style={{ color: "hsl(var(--dark))" }}>Premium Feature</h2>
          <p className="text-[13px] font-sans max-w-[260px]" style={{ color: "hsl(var(--text-muted))" }}>
            Upgrade to Premium to book appointments with certified doctors and get personalised medical advice.
          </p>
          <motion.button whileTap={{ scale: 0.97 }} className="mt-6 px-6 py-3 rounded-[14px] text-[14px] font-sans font-semibold ios-press"
            style={{ background: "hsl(var(--coral))", color: "white" }}>
            Upgrade to Premium
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  if (booked) {
    return (
      <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <button onClick={() => { setBooked(false); setSelectedDoctor(null); setSelectedSlot(null); }} className="ios-press">
            <IonIcon name="arrow-back" size={22} style={{ color: "hsl(var(--dark))" }} />
          </button>
          <h1 className="text-[24px] font-serif" style={{ color: "hsl(var(--dark))" }}>Appointments</h1>
        </motion.div>
        <motion.div variants={fadeUp} className="flex flex-col items-center text-center py-12">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: "hsl(var(--light-green))" }}>
            <IonIcon name="checkmark-circle" size={40} style={{ color: "hsl(var(--green))" }} />
          </motion.div>
          <h2 className="text-[20px] font-serif mb-2" style={{ color: "hsl(var(--dark))" }}>Appointment Booked!</h2>
          <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
            {MOCK_DOCTORS.find((d) => d.id === selectedDoctor)?.name} — {selectedSlot}
          </p>
          <p className="text-[11px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
            15-minute session • You'll receive a reminder
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <button onClick={onBack} className="ios-press">
          <IonIcon name="arrow-back" size={22} style={{ color: "hsl(var(--dark))" }} />
        </button>
        <h1 className="text-[24px] font-serif" style={{ color: "hsl(var(--dark))" }}>Book Appointment</h1>
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-[12px] px-3 py-2 flex items-start gap-2" style={{ background: "hsl(var(--light-green))" }}>
        <IonIcon name="information-circle-outline" size={14} style={{ color: "hsl(var(--green))", marginTop: 2, flexShrink: 0 }} />
        <p className="text-[10px] font-sans leading-[1.5]" style={{ color: "hsl(var(--green))" }}>
          One 15-minute appointment per week. You can send text or audio messages.
        </p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-2">AVAILABLE DOCTORS</p>
        <div className="space-y-2">
          {MOCK_DOCTORS.map((doc) => {
            const isSelected = selectedDoctor === doc.id;
            return (
              <div key={doc.id}>
                <button
                  onClick={() => setSelectedDoctor(isSelected ? null : doc.id)}
                  className="w-full tend-card p-4 flex items-center gap-3 ios-press text-left"
                  style={{ border: isSelected ? "2px solid hsl(var(--green))" : "2px solid transparent" }}
                >
                  <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[18px] font-serif text-white flex-shrink-0"
                    style={{ background: "hsl(var(--green))" }}>
                    {doc.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>{doc.name}</p>
                    <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{doc.specialty}</p>
                  </div>
                  <IonIcon name={isSelected ? "chevron-up" : "chevron-down"} size={16} style={{ color: "hsl(var(--text-muted))" }} />
                </button>

                {isSelected && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    className="overflow-hidden">
                    <div className="px-4 py-3 flex flex-wrap gap-2">
                      {doc.available.map((slot) => (
                        <button key={slot} onClick={() => setSelectedSlot(slot)}
                          className="px-3 py-2 rounded-[10px] text-[12px] font-sans font-medium ios-press"
                          style={{
                            background: selectedSlot === slot ? "hsl(var(--green))" : "hsl(var(--light-green))",
                            color: selectedSlot === slot ? "white" : "hsl(var(--green))",
                          }}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {selectedSlot && (
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setBooked(true)}
          className="w-full py-3.5 rounded-[14px] text-[15px] font-sans font-semibold ios-press"
          style={{ background: "hsl(var(--green))", color: "white", boxShadow: "0 4px 16px hsla(153,42%,30%,0.3)" }}>
          Confirm Appointment
        </motion.button>
      )}
    </motion.div>
  );
};

export default AppointmentsScreen;

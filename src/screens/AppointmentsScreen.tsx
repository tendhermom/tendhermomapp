import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hapticSuccess, hapticSelection, localNotification } from "@/lib/despia";

interface AppointmentsScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  avatar_url: string | null;
  bio: string | null;
}

interface Slot {
  id: string;
  doctor_id: string;
  slot_date: string;
  slot_time: string;
  is_booked: boolean;
}

interface Appointment {
  id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  created_at: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const formatTime = (t: string) => {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${ampm}`;
};

const formatDate = (d: string) => {
  const date = new Date(d + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
  return date.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" });
};

const AppointmentsScreen = ({ onBack, onNavigate }: AppointmentsScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan_type === "premium";

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<"list" | "pick-date" | "pick-slot" | "confirm" | "success">("list");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  // Fetch data
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [docRes, apptRes] = await Promise.all([
        supabase.from("doctors").select("*").eq("is_active", true),
        supabase.from("appointments").select("*").eq("user_id", user.id).order("appointment_date", { ascending: true }),
      ]);
      if (docRes.data) setDoctors(docRes.data as Doctor[]);
      if (apptRes.data) setMyAppointments(apptRes.data as Appointment[]);
      setLoading(false);
    };
    load();
  }, [user]);

  // Load slots when doctor selected
  useEffect(() => {
    if (!selectedDoctor) return;
    const loadSlots = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("doctor_slots")
        .select("*")
        .eq("doctor_id", selectedDoctor.id)
        .eq("is_booked", false)
        .gte("slot_date", today)
        .order("slot_date")
        .order("slot_time");
      if (data) setSlots(data as Slot[]);
    };
    loadSlots();
  }, [selectedDoctor]);

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    slots.forEach((s) => {
      if (!map[s.slot_date]) map[s.slot_date] = [];
      map[s.slot_date].push(s);
    });
    return map;
  }, [slots]);

  const availableDates = Object.keys(slotsByDate);

  const handleSelectDoctor = (doc: Doctor) => {
    hapticSelection();
    setSelectedDoctor(doc);
    setSelectedDate(null);
    setSelectedSlot(null);
    setStep("pick-date");
  };

  const handleSelectDate = (date: string) => {
    hapticSelection();
    setSelectedDate(date);
    setStep("pick-slot");
  };

  const handleSelectSlot = (slot: Slot) => {
    hapticSelection();
    setSelectedSlot(slot);
    setStep("confirm");
  };

  const handleBook = async () => {
    if (!user || !selectedDoctor || !selectedSlot) return;
    setBooking(true);
    try {
      // Book the slot
      const { error: slotErr } = await supabase
        .from("doctor_slots")
        .update({ is_booked: true })
        .eq("id", selectedSlot.id);
      if (slotErr) throw slotErr;

      // Create appointment
      const { error: apptErr } = await supabase.from("appointments").insert({
        user_id: user.id,
        doctor_id: selectedDoctor.id,
        slot_id: selectedSlot.id,
        appointment_date: selectedSlot.slot_date,
        appointment_time: selectedSlot.slot_time,
        notes: notes || null,
      });
      if (apptErr) throw apptErr;

      // Create reminder notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Appointment Confirmed",
        body: `Your appointment with ${selectedDoctor.full_name} on ${formatDate(selectedSlot.slot_date)} at ${formatTime(selectedSlot.slot_time)} is confirmed.`,
        type: "appointment",
      });

      hapticSuccess();
      setStep("success");

      // Refresh appointments
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("appointment_date", { ascending: true });
      if (data) setMyAppointments(data as Appointment[]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to book appointment. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (apptId: string, slotId: string) => {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", apptId);
    if (!error) {
      await supabase.from("doctor_slots").update({ is_booked: false }).eq("id", slotId);
      setMyAppointments((prev) => prev.map((a) => (a.id === apptId ? { ...a, status: "cancelled" } : a)));
      toast.success("Appointment cancelled");
    }
  };

  const resetFlow = () => {
    setStep("list");
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setNotes("");
  };

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  // Premium gate
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
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => onNavigate?.("premium")}
            className="mt-6 px-6 py-3 rounded-[14px] text-[14px] font-sans font-semibold ios-press"
            style={{ background: "hsl(var(--coral))", color: "white" }}>
            Upgrade to Premium
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // Success state
  if (step === "success") {
    return (
      <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <button onClick={resetFlow} className="ios-press">
            <IonIcon name="arrow-back" size={22} style={{ color: "hsl(var(--dark))" }} />
          </button>
          <h1 className="text-[24px] font-serif" style={{ color: "hsl(var(--dark))" }}>Appointments</h1>
        </motion.div>
        <motion.div variants={fadeUp} className="flex flex-col items-center text-center py-10">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: "hsl(var(--light-green))" }}>
            <IonIcon name="checkmark-circle" size={40} style={{ color: "hsl(var(--green))" }} />
          </motion.div>
          <h2 className="text-[20px] font-serif mb-2" style={{ color: "hsl(var(--dark))" }}>Appointment Booked!</h2>
          <p className="text-[14px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
            {selectedDoctor?.full_name}
          </p>
          <p className="text-[13px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
            {selectedSlot && `${formatDate(selectedSlot.slot_date)} · ${formatTime(selectedSlot.slot_time)}`}
          </p>
          <p className="text-[11px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
            15-minute session · You'll receive a reminder
          </p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={resetFlow}
            className="mt-8 w-full py-3.5 rounded-[14px] text-[15px] font-sans font-semibold ios-press"
            style={{ background: "hsl(var(--green))", color: "white", boxShadow: "0 4px 16px hsla(153,42%,30%,0.3)" }}>
            View My Appointments
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <button onClick={step === "list" ? onBack : () => {
          if (step === "pick-date") resetFlow();
          else if (step === "pick-slot") setStep("pick-date");
          else if (step === "confirm") setStep("pick-slot");
        }} className="ios-press">
          <IonIcon name="arrow-back" size={22} style={{ color: "hsl(var(--dark))" }} />
        </button>
        <h1 className="text-[24px] font-serif" style={{ color: "hsl(var(--dark))" }}>
          {step === "list" ? "Appointments" : step === "pick-date" ? "Select Date" : step === "pick-slot" ? "Select Time" : "Confirm Booking"}
        </h1>
      </motion.div>

      {/* Info bar */}
      <motion.div variants={fadeUp} className="rounded-[12px] px-3 py-2.5 flex items-start gap-2" style={{ background: "hsl(var(--light-green))" }}>
        <IonIcon name="information-circle-outline" size={14} style={{ color: "hsl(var(--green))", marginTop: 2, flexShrink: 0 }} />
        <p className="text-[11px] font-sans leading-[1.5]" style={{ color: "hsl(var(--green))" }}>
          One 15-minute appointment per week with a certified doctor.
        </p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* STEP: Doctor list + upcoming appointments */}
          {step === "list" && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Upcoming Appointments */}
              {myAppointments.filter((a) => a.status === "confirmed" && a.appointment_date >= new Date().toISOString().split("T")[0]).length > 0 && (
                <div>
                  <p className="label-caps text-text-muted mb-2">UPCOMING</p>
                  <div className="space-y-2">
                    {myAppointments
                      .filter((a) => a.status === "confirmed" && a.appointment_date >= new Date().toISOString().split("T")[0])
                      .slice(0, 3)
                      .map((appt) => {
                        const doc = doctors.find((d) => d.id === appt.doctor_id);
                        return (
                          <div key={appt.id} className="tend-card p-4 flex items-center gap-3">
                            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[15px] font-serif text-white flex-shrink-0"
                              style={{ background: "hsl(var(--green))" }}>
                              {doc ? initials(doc.full_name) : "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-sans font-semibold truncate" style={{ color: "hsl(var(--dark))" }}>
                                {doc?.full_name}
                              </p>
                              <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                                {formatDate(appt.appointment_date)} · {formatTime(appt.appointment_time)}
                              </p>
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleCancel(appt.id, (appt as any).slot_id)}
                              className="text-[11px] font-sans font-semibold px-3 py-1.5 rounded-full"
                              style={{ color: "hsl(var(--coral))", background: "hsl(var(--light-coral))" }}>
                              Cancel
                            </motion.button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Doctors */}
              <div>
                <p className="label-caps text-text-muted mb-2">AVAILABLE DOCTORS</p>
                <div className="space-y-2">
                  {doctors.map((doc) => (
                    <motion.button key={doc.id} whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectDoctor(doc)}
                      className="w-full tend-card p-4 flex items-center gap-3 ios-press text-left">
                      <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center text-[16px] font-serif text-white flex-shrink-0"
                        style={{ background: "hsl(var(--green))" }}>
                        {initials(doc.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>{doc.full_name}</p>
                        <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{doc.specialty}</p>
                        {doc.bio && (
                          <p className="text-[11px] font-sans mt-0.5 line-clamp-1" style={{ color: "hsl(var(--text-muted))" }}>{doc.bio}</p>
                        )}
                      </div>
                      <IonIcon name="chevron-forward" size={16} style={{ color: "hsl(var(--border))" }} />
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: Pick date */}
          {step === "pick-date" && (
            <motion.div key="pick-date" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-3">
              <div className="tend-card p-4 flex items-center gap-3">
                <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[15px] font-serif text-white flex-shrink-0"
                  style={{ background: "hsl(var(--green))" }}>
                  {selectedDoctor && initials(selectedDoctor.full_name)}
                </div>
                <div>
                  <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>{selectedDoctor?.full_name}</p>
                  <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{selectedDoctor?.specialty}</p>
                </div>
              </div>

              <p className="label-caps text-text-muted">AVAILABLE DATES</p>
              {availableDates.length === 0 ? (
                <div className="tend-card p-6 text-center">
                  <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>No available slots for this doctor.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableDates.map((date) => (
                    <motion.button key={date} whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelectDate(date)}
                      className="tend-card p-4 text-center ios-press">
                      <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                        {formatDate(date)}
                      </p>
                      <p className="text-[11px] font-sans mt-0.5" style={{ color: "hsl(var(--green))" }}>
                        {slotsByDate[date].length} slot{slotsByDate[date].length !== 1 ? "s" : ""}
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP: Pick time slot */}
          {step === "pick-slot" && selectedDate && (
            <motion.div key="pick-slot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-3">
              <div className="tend-card p-4 flex items-center gap-3">
                <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[15px] font-serif text-white flex-shrink-0"
                  style={{ background: "hsl(var(--green))" }}>
                  {selectedDoctor && initials(selectedDoctor.full_name)}
                </div>
                <div>
                  <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>{selectedDoctor?.full_name}</p>
                  <p className="text-[11px] font-sans" style={{ color: "hsl(var(--green))" }}>{formatDate(selectedDate)}</p>
                </div>
              </div>

              <p className="label-caps text-text-muted">SELECT TIME</p>
              <div className="grid grid-cols-3 gap-2">
                {slotsByDate[selectedDate]?.map((slot) => (
                  <motion.button key={slot.id} whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectSlot(slot)}
                    className="tend-card py-3 text-center ios-press">
                    <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                      {formatTime(slot.slot_time)}
                    </p>
                    <p className="text-[10px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>15 min</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP: Confirm */}
          {step === "confirm" && selectedSlot && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <div className="tend-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[18px] font-serif text-white flex-shrink-0"
                    style={{ background: "hsl(var(--green))" }}>
                    {selectedDoctor && initials(selectedDoctor.full_name)}
                  </div>
                  <div>
                    <p className="text-[15px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>{selectedDoctor?.full_name}</p>
                    <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{selectedDoctor?.specialty}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: "calendar-outline", label: "Date", value: formatDate(selectedSlot.slot_date) },
                    { icon: "time-outline", label: "Time", value: formatTime(selectedSlot.slot_time) },
                    { icon: "hourglass-outline", label: "Duration", value: "15 minutes" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3" style={{ borderTop: "0.5px solid hsl(var(--border))", paddingTop: 12 }}>
                      <IonIcon name={item.icon} size={18} style={{ color: "hsl(var(--green))" }} />
                      <div className="flex-1">
                        <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{item.label}</p>
                        <p className="text-[14px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="label-caps text-text-muted mb-2">NOTES FOR DOCTOR (OPTIONAL)</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your symptoms or concerns…"
                  rows={3}
                  className="w-full tend-card p-4 text-[13px] font-sans resize-none focus:outline-none no-scrollbar"
                  style={{ color: "hsl(var(--dark))" }}
                />
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleBook} disabled={booking}
                className="w-full py-3.5 rounded-[14px] text-[15px] font-sans font-semibold ios-press disabled:opacity-60"
                style={{ background: "hsl(var(--green))", color: "white", boxShadow: "0 4px 16px hsla(153,42%,30%,0.3)" }}>
                {booking ? "Booking…" : "Confirm Appointment"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default AppointmentsScreen;

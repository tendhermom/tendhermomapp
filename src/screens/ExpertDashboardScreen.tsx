import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hapticSuccess, hapticSelection } from "@/lib/despia";

interface ExpertDashboardScreenProps {
  onNavigate: (screen: string) => void;
}

interface Slot {
  id: string;
  slot_date: string;
  slot_time: string;
  is_booked: boolean;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  user_id: string;
  created_at: string;
}

interface PatientProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  current_stage: string;
}

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30",
];

const formatTime = (t: string) => {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

const formatDateLabel = (d: string) => {
  const date = new Date(d + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
  return date.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" });
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const ExpertDashboardScreen = ({ onNavigate }: ExpertDashboardScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const [activeView, setActiveView] = useState<"dashboard" | "availability" | "bookings">("dashboard");
  const [mySlots, setMySlots] = useState<Slot[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Record<string, PatientProfile>>({});
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [savingSlots, setSavingSlots] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const [slotsRes, apptsRes] = await Promise.all([
      supabase.from("doctor_slots").select("*").eq("doctor_id", user.id).gte("slot_date", today).order("slot_date").order("slot_time"),
      supabase.from("appointments").select("*").eq("doctor_id", user.id).gte("appointment_date", today).order("appointment_date").order("appointment_time"),
    ]);

    if (slotsRes.data) setMySlots(slotsRes.data as Slot[]);
    if (apptsRes.data) {
      const appts = apptsRes.data as Appointment[];
      setMyAppointments(appts);
      const userIds = [...new Set(appts.map((a) => a.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url, current_stage").in("id", userIds);
        if (profiles) {
          const map: Record<string, PatientProfile> = {};
          profiles.forEach((p) => { map[p.id] = p as PatientProfile; });
          setPatients(map);
        }
      }
    }
    setLoading(false);
  };

  const toggleTime = (time: string) => {
    hapticSelection();
    setSelectedTimes((prev) => prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]);
  };

  const existingSlotsForDate = useMemo(() => {
    return mySlots.filter((s) => s.slot_date === selectedDate).map((s) => s.slot_time.slice(0, 5));
  }, [mySlots, selectedDate]);

  const handleSaveSlots = async () => {
    if (!user || selectedTimes.length === 0) return;
    setSavingSlots(true);
    const newTimes = selectedTimes.filter((t) => !existingSlotsForDate.includes(t));
    if (newTimes.length === 0) {
      toast.info("All selected times are already added.");
      setSavingSlots(false);
      return;
    }

    const rows = newTimes.map((t) => ({
      doctor_id: user.id,
      slot_date: selectedDate,
      slot_time: t,
    }));

    const { error } = await supabase.from("doctor_slots").insert(rows);
    if (error) {
      toast.error("Failed to save slots");
    } else {
      hapticSuccess();
      toast.success(`${newTimes.length} slot(s) added!`);
      setSelectedTimes([]);
      await loadData();
    }
    setSavingSlots(false);
  };

  const handleDeleteSlot = async (slotId: string) => {
    const { error } = await supabase.from("doctor_slots").delete().eq("id", slotId).eq("is_booked", false);
    if (error) {
      toast.error("Cannot remove a booked slot");
    } else {
      setMySlots((prev) => prev.filter((s) => s.id !== slotId));
      toast.success("Slot removed");
    }
  };

  const upcomingAppts = myAppointments.filter((a) => a.status === "confirmed");
  const totalSlots = mySlots.length;
  const bookedSlots = mySlots.filter((s) => s.is_booked).length;
  const availableSlots = totalSlots - bookedSlots;

  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const dateOptions = useMemo(() => {
    const dates: string[] = [];
    const d = new Date();
    for (let i = 1; i <= 14; i++) {
      const next = new Date(d);
      next.setDate(d.getDate() + i);
      dates.push(next.toISOString().split("T")[0]);
    }
    return dates;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
      <motion.div variants={fadeUp}>
        <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Welcome back,</p>
        <h1 className="font-serif text-[26px] leading-tight" style={{ color: "hsl(var(--dark))" }}>
          Dr. {user?.full_name?.split(" ")[0]}
        </h1>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-2">
        {(["dashboard", "availability", "bookings"] as const).map((tab) => (
          <motion.button
            key={tab}
            whileTap={{ scale: 0.95 }}
            onClick={() => { hapticSelection(); setActiveView(tab); }}
            className="px-4 py-2 rounded-full text-[13px] font-sans font-semibold capitalize"
            style={{
              background: activeView === tab ? "hsl(var(--green))" : "hsl(var(--surface))",
              color: activeView === tab ? "white" : "hsl(var(--text-muted))",
            }}
          >
            {tab}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {activeView === "dashboard" && (
          <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Upcoming", value: upcomingAppts.length, icon: "calendar-outline", color: "hsl(var(--green))", bg: "hsl(var(--light-green))" },
                { label: "Available", value: availableSlots, icon: "time-outline", color: "hsl(var(--green))", bg: "hsl(var(--light-green))" },
                { label: "Booked", value: bookedSlots, icon: "checkmark-circle-outline", color: "hsl(var(--coral))", bg: "hsl(var(--light-coral))" },
              ].map((stat) => (
                <div key={stat.label} className="tend-card p-3.5 text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: stat.bg }}>
                    <IonIcon name={stat.icon} size={20} style={{ color: stat.color }} />
                  </div>
                  <p className="text-[22px] font-serif" style={{ color: "hsl(var(--dark))" }}>{stat.value}</p>
                  <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="label-caps text-text-muted">Quick Actions</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveView("availability")}
                className="w-full tend-card p-4 flex items-center gap-3 text-left"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--light-green))" }}>
                  <IonIcon name="add-circle-outline" size={22} style={{ color: "hsl(var(--green))" }} />
                </div>
                <div>
                  <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>Add Availability</p>
                  <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Set your consultation hours</p>
                </div>
                <IonIcon name="chevron-forward" size={18} style={{ color: "hsl(var(--text-muted))", marginLeft: "auto" }} />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveView("bookings")}
                className="w-full tend-card p-4 flex items-center gap-3 text-left"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--light-coral))" }}>
                  <IonIcon name="people-outline" size={22} style={{ color: "hsl(var(--coral))" }} />
                </div>
                <div>
                  <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>View Bookings</p>
                  <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{upcomingAppts.length} upcoming session{upcomingAppts.length !== 1 ? "s" : ""}</p>
                </div>
                <IonIcon name="chevron-forward" size={18} style={{ color: "hsl(var(--text-muted))", marginLeft: "auto" }} />
              </motion.button>
            </div>

            {upcomingAppts.length > 0 && (
              <div className="space-y-2">
                <p className="label-caps text-text-muted">UPCOMING SESSIONS</p>
                {upcomingAppts.slice(0, 5).map((appt) => {
                  const patient = patients[appt.user_id];
                  return (
                    <div key={appt.id} className="tend-card p-4 flex items-center gap-3">
                      <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[14px] font-serif text-white flex-shrink-0"
                        style={{ background: "hsl(var(--green))" }}>
                        {patient ? initials(patient.full_name) : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-sans font-semibold truncate" style={{ color: "hsl(var(--dark))" }}>
                          {patient?.full_name || "Patient"}
                        </p>
                        <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                          {formatDateLabel(appt.appointment_date)} · {formatTime(appt.appointment_time)}
                        </p>
                        {patient?.current_stage && (
                          <p className="text-[11px] font-sans capitalize" style={{ color: "hsl(var(--text-muted))" }}>
                            {patient.current_stage.replace("_", " ")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeView === "availability" && (
          <motion.div key="avail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="tend-card p-4">
              <p className="text-[14px] font-sans font-semibold mb-3" style={{ color: "hsl(var(--dark))" }}>
                Select Date
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                {dateOptions.map((d) => {
                  const dayObj = new Date(d + "T00:00:00");
                  const isSelected = d === selectedDate;
                  return (
                    <motion.button
                      key={d}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setSelectedDate(d); setSelectedTimes([]); }}
                      className="flex flex-col items-center px-3 py-2.5 rounded-2xl shrink-0 min-w-[52px]"
                      style={{
                        background: isSelected ? "hsl(var(--green))" : "hsl(var(--surface))",
                        color: isSelected ? "white" : "hsl(var(--dark))",
                      }}
                    >
                      <span className="text-[10px] font-sans uppercase" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "hsl(var(--text-muted))" }}>
                        {dayObj.toLocaleDateString("en", { weekday: "short" })}
                      </span>
                      <span className="text-[18px] font-serif">{dayObj.getDate()}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="tend-card p-4">
              <p className="text-[14px] font-sans font-semibold mb-1" style={{ color: "hsl(var(--dark))" }}>
                Available Times for {formatDateLabel(selectedDate)}
              </p>
              <p className="text-[12px] font-sans mb-3" style={{ color: "hsl(var(--text-muted))" }}>
                Tap to select slots (15-min sessions)
              </p>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((t) => {
                  const exists = existingSlotsForDate.includes(t);
                  const isSelected = selectedTimes.includes(t);
                  return (
                    <motion.button
                      key={t}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => !exists && toggleTime(t)}
                      disabled={exists}
                      className="py-2.5 rounded-xl text-[12px] font-sans font-medium"
                      style={{
                        background: exists ? "hsl(var(--border-subtle))" : isSelected ? "hsl(var(--green))" : "hsl(var(--surface))",
                        color: exists ? "hsl(var(--text-muted))" : isSelected ? "white" : "hsl(var(--dark))",
                        opacity: exists ? 0.5 : 1,
                      }}
                    >
                      {formatTime(t)}
                    </motion.button>
                  );
                })}
              </div>

              {selectedTimes.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSaveSlots}
                  disabled={savingSlots}
                  className="w-full py-3.5 rounded-2xl text-[15px] font-sans font-semibold text-white mt-4 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--green)), hsl(153 42% 22%))",
                    boxShadow: "0 4px 16px -4px hsla(153,42%,30%,0.4)",
                  }}
                >
                  {savingSlots ? "Saving…" : `Add ${selectedTimes.length} Slot${selectedTimes.length !== 1 ? "s" : ""}`}
                </motion.button>
              )}
            </div>

            {mySlots.filter((s) => s.slot_date === selectedDate).length > 0 && (
              <div className="space-y-2">
                <p className="label-caps text-text-muted">YOUR SLOTS FOR {formatDateLabel(selectedDate).toUpperCase()}</p>
                {mySlots
                  .filter((s) => s.slot_date === selectedDate)
                  .map((slot) => (
                    <div key={slot.id} className="tend-card p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IonIcon name={slot.is_booked ? "lock-closed-outline" : "time-outline"} size={18}
                          style={{ color: slot.is_booked ? "hsl(var(--coral))" : "hsl(var(--green))" }} />
                        <div>
                          <p className="text-[14px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>
                            {formatTime(slot.slot_time)}
                          </p>
                          <p className="text-[11px] font-sans" style={{ color: slot.is_booked ? "hsl(var(--coral))" : "hsl(var(--text-muted))" }}>
                            {slot.is_booked ? "Booked" : "Available"}
                          </p>
                        </div>
                      </div>
                      {!slot.is_booked && (
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteSlot(slot.id)}>
                          <IonIcon name="trash-outline" size={18} style={{ color: "hsl(var(--coral))" }} />
                        </motion.button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        )}

        {activeView === "bookings" && (
          <motion.div key="bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {upcomingAppts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(var(--light-green))" }}>
                  <IonIcon name="calendar-outline" size={28} style={{ color: "hsl(var(--green))" }} />
                </div>
                <p className="text-[16px] font-serif mb-1" style={{ color: "hsl(var(--dark))" }}>No upcoming bookings</p>
                <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                  Add availability slots so mothers can book sessions.
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveView("availability")}
                  className="mt-4 px-6 py-2.5 rounded-full text-[14px] font-sans font-semibold"
                  style={{ background: "hsl(var(--green))", color: "white" }}
                >
                  Add Availability
                </motion.button>
              </div>
            ) : (
              upcomingAppts.map((appt) => {
                const patient = patients[appt.user_id];
                return (
                  <div key={appt.id} className="tend-card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center text-[16px] font-serif text-white flex-shrink-0"
                        style={{ background: "hsl(var(--green))" }}>
                        {patient?.avatar_url ? (
                          <img src={patient.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                        ) : (
                          initials(patient?.full_name || "?")
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[15px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                          {patient?.full_name || "Patient"}
                        </p>
                        {patient?.current_stage && (
                          <p className="text-[12px] font-sans capitalize" style={{ color: "hsl(var(--text-muted))" }}>
                            {patient.current_stage.replace("_", " ")}
                          </p>
                        )}
                      </div>
                      <div className="px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold" style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}>
                        Confirmed
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pl-1">
                      <div className="flex items-center gap-1.5">
                        <IonIcon name="calendar-outline" size={14} style={{ color: "hsl(var(--text-muted))" }} />
                        <span className="text-[13px] font-sans" style={{ color: "hsl(var(--dark))" }}>
                          {formatDateLabel(appt.appointment_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <IonIcon name="time-outline" size={14} style={{ color: "hsl(var(--text-muted))" }} />
                        <span className="text-[13px] font-sans" style={{ color: "hsl(var(--dark))" }}>
                          {formatTime(appt.appointment_time)}
                        </span>
                      </div>
                    </div>
                    {appt.notes && (
                      <div className="rounded-xl p-3" style={{ background: "hsl(var(--surface))" }}>
                        <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                          <strong>Note:</strong> {appt.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExpertDashboardScreen;

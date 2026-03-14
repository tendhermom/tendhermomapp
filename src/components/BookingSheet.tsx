import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface BookingSheetProps {
  doctor: {
    id: string;
    name: string;
    specialty: string;
    consultation_fee: number | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onBooked?: () => void;
}

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "2:00 PM", "2:30 PM", "3:00 PM",
  "3:30 PM", "4:00 PM",
];

const getNextDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const BookingSheet = ({ doctor, isOpen, onClose, onBooked }: BookingSheetProps) => {
  const [selectedDate, setSelectedDate] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const user = useAuthStore((s) => s.user);
  const days = getNextDays();

  const initials = doctor.name
    .split(" ")
    .filter((_, i) => i === 0 || i === doctor.name.split(" ").length - 1)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const fee = doctor.consultation_fee
    ? `₦${doctor.consultation_fee.toLocaleString()}`
    : "Free";

  const handleConfirm = async () => {
    if (!selectedTime || !user) return;
    setBooking(true);

    const bookingDate = days[selectedDate];
    const dateStr = bookingDate.toISOString().split("T")[0];

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      doctor_id: doctor.id,
      booking_date: dateStr,
      time_slot: selectedTime,
      notes: notes.trim() || null,
    });

    setBooking(false);

    if (error) {
      toast.error("Failed to book. Please try again.");
    } else {
      toast.success(`Booked with ${doctor.name}!`);
      onBooked?.();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60]"
            style={{ background: "rgba(0,0,0,0.4)" }}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 380 }}
            className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[28px] max-h-[85vh] overflow-y-auto"
            style={{ background: "hsl(var(--bg))", boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-[36px] h-[4px] rounded-full" style={{ background: "hsl(var(--border))" }} />
            </div>

            <div className="px-6 pb-8 space-y-5">
              {/* Doctor info */}
              <div className="flex items-center gap-3.5">
                <div
                  className="w-[48px] h-[48px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(var(--light-green))" }}
                >
                  <span className="text-[14px] font-bold font-sans" style={{ color: "hsl(var(--green))" }}>
                    {initials}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-[17px] font-serif" style={{ color: "hsl(var(--dark))" }}>{doctor.name}</h3>
                  <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{doctor.specialty}</p>
                </div>
                <div className="text-right">
                  <span className="text-[16px] font-bold font-sans" style={{ color: "hsl(var(--coral))" }}>{fee}</span>
                </div>
              </div>

              <div style={{ height: "0.5px", background: "hsl(var(--border))" }} />

              {/* Date picker */}
              <div>
                <h4 className="text-[15px] font-semibold font-sans mb-3" style={{ color: "hsl(var(--dark))" }}>Select Date</h4>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-1">
                  {days.map((day, i) => {
                    const isSelected = selectedDate === i;
                    const isToday = i === 0;
                    return (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setSelectedDate(i)}
                        className="flex flex-col items-center gap-1 py-3 px-3 rounded-2xl flex-shrink-0 min-w-[52px] transition-all"
                        style={{
                          background: isSelected ? "hsl(var(--green))" : "hsl(var(--surface))",
                          boxShadow: isSelected ? "0 4px 16px hsla(153,42%,30%,0.25)" : "0 1px 4px rgba(0,0,0,0.04)",
                        }}
                      >
                        <span className="text-[10px] font-semibold font-sans uppercase" style={{ color: isSelected ? "rgba(255,255,255,0.6)" : "hsl(var(--text-muted))" }}>
                          {isToday ? "Today" : dayNames[day.getDay()]}
                        </span>
                        <span className="text-[18px] font-bold font-sans" style={{ color: isSelected ? "white" : "hsl(var(--dark))" }}>
                          {day.getDate()}
                        </span>
                        <span className="text-[9px] font-medium font-sans" style={{ color: isSelected ? "rgba(255,255,255,0.5)" : "hsl(var(--text-muted))" }}>
                          {monthNames[day.getMonth()]}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <h4 className="text-[15px] font-semibold font-sans mb-3" style={{ color: "hsl(var(--dark))" }}>Select Time</h4>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <motion.button
                        key={time}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setSelectedTime(time)}
                        className="py-[12px] rounded-xl text-[13px] font-semibold font-sans transition-all"
                        style={{
                          background: isSelected ? "hsl(var(--green))" : "hsl(var(--surface))",
                          color: isSelected ? "white" : "hsl(var(--dark))",
                          boxShadow: isSelected ? "0 4px 16px hsla(153,42%,30%,0.25)" : "0 1px 4px rgba(0,0,0,0.04)",
                        }}
                      >
                        {time}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-[15px] font-semibold font-sans mb-2" style={{ color: "hsl(var(--dark))" }}>
                  Notes <span className="font-normal text-[12px]" style={{ color: "hsl(var(--text-muted))" }}>(optional)</span>
                </h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any symptoms or questions for the doctor…"
                  maxLength={500}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl text-[14px] font-sans outline-none resize-none"
                  style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", border: "1.5px solid hsl(var(--border-subtle))" }}
                />
              </div>

              {/* Confirm */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleConfirm}
                disabled={!selectedTime || booking}
                className="w-full py-[16px] rounded-2xl text-[15px] font-bold font-sans transition-all"
                style={{
                  background: selectedTime ? "hsl(var(--green))" : "hsl(var(--border))",
                  color: selectedTime ? "white" : "hsl(var(--text-muted))",
                  boxShadow: selectedTime ? "0 6px 24px hsla(153,42%,30%,0.3)" : "none",
                  opacity: booking ? 0.7 : 1,
                }}
              >
                {booking
                  ? "Booking…"
                  : selectedTime
                    ? `Confirm — ${days[selectedDate].getDate()} ${monthNames[days[selectedDate].getMonth()]}, ${selectedTime}`
                    : "Select a time slot"}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BookingSheet;

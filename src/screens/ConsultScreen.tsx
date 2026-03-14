import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import DoctorCard from "@/components/cards/DoctorCard";
import PremiumUpsell from "@/components/cards/PremiumUpsell";
import TopBar from "@/components/navigation/TopBar";
import BookingSheet from "@/components/BookingSheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";

interface ConsultScreenProps {
  onNavigate: (tab: string) => void;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string | null;
  rating: number | null;
  experience_years: number | null;
  consultation_fee: number | null;
  available: boolean;
  image_url: string | null;
}

interface Booking {
  id: string;
  booking_date: string;
  time_slot: string;
  status: string;
  doctor_name?: string;
  doctor_specialty?: string;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const ConsultScreen = ({ onNavigate }: ConsultScreenProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const user = useAuthStore((s) => s.user);

  const fetchData = async () => {
    setLoading(true);

    const [doctorsRes, bookingsRes] = await Promise.all([
      supabase.from("doctors").select("*").order("rating", { ascending: false }),
      user
        ? supabase
            .from("bookings")
            .select("id, booking_date, time_slot, status, doctor_id")
            .eq("user_id", user.id)
            .order("booking_date", { ascending: true })
            .limit(10)
        : Promise.resolve({ data: [] }),
    ]);

    const doctorsData = (doctorsRes.data || []) as Doctor[];
    setDoctors(doctorsData);

    // Map doctor names to bookings
    const doctorMap = new Map(doctorsData.map((d) => [d.id, d]));
    const bookingsData: Booking[] = ((bookingsRes as any).data || []).map((b: any) => ({
      ...b,
      doctor_name: doctorMap.get(b.doctor_id)?.name || "Doctor",
      doctor_specialty: doctorMap.get(b.doctor_id)?.specialty || "",
    }));
    setBookings(bookingsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const specialties = ["All", ...new Set(doctors.map((d) => d.specialty))];
  const filtered = activeFilter === "All" ? doctors : doctors.filter((d) => d.specialty === activeFilter);

  // Next upcoming booking
  const today = new Date().toISOString().split("T")[0];
  const nextBooking = bookings.find((b) => b.booking_date >= today && b.status === "pending");

  return (
    <motion.div className="space-y-6 pb-4" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <TopBar onProfilePress={() => onNavigate("profile")} onAIChatPress={() => onNavigate("ai-chat")} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <h1 className="font-serif text-[26px]" style={{ color: "hsl(var(--dark))" }}>Consultations</h1>
        <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Book with specialists</p>
      </motion.div>

      {/* Next appointment hero */}
      <motion.div variants={fadeUp}>
        <motion.div whileTap={{ scale: 0.98 }} className="hero-card p-5">
          <div className="relative z-10">
            {nextBooking ? (
              <>
                <span className="label-caps" style={{ color: "rgba(255,255,255,0.5)" }}>Next Appointment</span>
                <h3 className="text-white text-[20px] font-serif mt-2">{nextBooking.doctor_name}</h3>
                <p className="text-white/60 text-[13px] font-sans mt-1">
                  {(() => {
                    const d = new Date(nextBooking.booking_date);
                    return `${d.getDate()} ${monthNames[d.getMonth()]}`;
                  })()}, {nextBooking.time_slot}
                </p>
                <p className="text-white/40 text-[11px] font-sans mt-0.5">{nextBooking.doctor_specialty}</p>
              </>
            ) : (
              <>
                <span className="label-caps" style={{ color: "rgba(255,255,255,0.5)" }}>No Upcoming</span>
                <h3 className="text-white text-[18px] font-serif mt-2">Book a consultation</h3>
                <p className="text-white/60 text-[13px] font-sans mt-1">Choose a specialist below to get started</p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Upcoming bookings list */}
      {bookings.filter((b) => b.booking_date >= today).length > 1 && (
        <motion.div variants={fadeUp}>
          <h3 className="text-[15px] font-semibold font-sans mb-2" style={{ color: "hsl(var(--dark))" }}>
            Upcoming Bookings
          </h3>
          <div className="space-y-2">
            {bookings
              .filter((b) => b.booking_date >= today)
              .slice(0, 5)
              .map((b) => {
                const d = new Date(b.booking_date);
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: "hsl(var(--surface))", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "hsl(var(--light-green))" }}
                    >
                      <IonIcon name="calendar-outline" size={18} style={{ color: "hsl(var(--green))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold font-sans truncate" style={{ color: "hsl(var(--dark))" }}>
                        {b.doctor_name}
                      </p>
                      <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                        {d.getDate()} {monthNames[d.getMonth()]} · {b.time_slot}
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-semibold font-sans uppercase px-2 py-1 rounded-full"
                      style={{
                        background: b.status === "pending" ? "hsl(var(--light-coral))" : "hsl(var(--light-green))",
                        color: b.status === "pending" ? "hsl(var(--coral))" : "hsl(var(--green))",
                      }}
                    >
                      {b.status}
                    </span>
                  </div>
                );
              })}
          </div>
        </motion.div>
      )}

      {/* Specialty filters */}
      {!loading && (
        <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto hide-scrollbar -mx-5 px-5 scrollbar-hide">
          {specialties.map((spec) => (
            <motion.button
              key={spec}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(spec)}
              className="text-[13px] font-semibold font-sans px-4 py-[9px] rounded-full flex-shrink-0 transition-all whitespace-nowrap"
              style={{
                background: activeFilter === spec ? "hsl(var(--green))" : "hsl(var(--surface))",
                color: activeFilter === spec ? "white" : "hsl(var(--text-muted))",
                boxShadow: activeFilter === spec ? "0 2px 12px hsla(153,42%,30%,0.3)" : "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              {spec}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Doctors */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, type: "spring" as const, stiffness: 300, damping: 30 }}
            >
              <DoctorCard doctor={doc} onBook={() => setBookingDoctor(doc)} />
            </motion.div>
          ))}
        </div>
      )}

      <motion.div variants={fadeUp}>
        <PremiumUpsell
          title="Unlock AI Health Chat"
          description="Get instant answers to your pregnancy questions powered by AI."
          ctaText="Try Premium"
          onAction={() => onNavigate("premium")}
        />
      </motion.div>

      {bookingDoctor && (
        <BookingSheet
          doctor={bookingDoctor}
          isOpen={!!bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onBooked={fetchData}
        />
      )}
    </motion.div>
  );
};

export default ConsultScreen;

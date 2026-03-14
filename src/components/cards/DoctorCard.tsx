import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

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

interface DoctorCardProps {
  doctor: Doctor;
  onBook?: () => void;
}

const DoctorCard = ({ doctor, onBook }: DoctorCardProps) => {
  const initials = doctor.name
    .split(" ")
    .filter((_, i) => i === 0 || i === doctor.name.split(" ").length - 1)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const fee = doctor.consultation_fee
    ? `₦${doctor.consultation_fee.toLocaleString()}`
    : "Free";

  return (
    <motion.div whileTap={{ scale: 0.98 }} className="tend-card p-[20px]">
      <div className="flex items-start gap-3.5">
        <div
          className="w-[50px] h-[50px] rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "hsl(var(--light-green))" }}
        >
          <span className="text-[15px] font-bold font-sans" style={{ color: "hsl(var(--green))" }}>
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-semibold font-sans truncate" style={{ color: "hsl(var(--dark))" }}>
            {doctor.name}
          </h4>
          <p className="text-[13px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
            {doctor.specialty}
          </p>
          {doctor.hospital && (
            <p className="text-[11px] font-sans mt-0.5 truncate" style={{ color: "hsl(var(--text-muted))" }}>
              {doctor.hospital}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {doctor.rating && (
              <div className="flex items-center gap-1">
                <IonIcon name="star" size={13} style={{ color: "#F5A623" }} />
                <span className="text-[12px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
                  {doctor.rating}
                </span>
              </div>
            )}
            {doctor.experience_years && (
              <span className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                {doctor.experience_years} yrs
              </span>
            )}
            {doctor.available && (
              <span className="flex items-center gap-1 text-[12px] font-medium font-sans" style={{ color: "hsl(var(--green))" }}>
                <span className="w-[5px] h-[5px] rounded-full inline-block" style={{ background: "hsl(var(--green))" }} />
                Available
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[16px] font-bold font-sans" style={{ color: "hsl(var(--coral))" }}>{fee}</p>
        </div>
      </div>
      {doctor.available && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onBook}
          className="w-full mt-4 py-[14px] rounded-2xl text-[15px] font-bold font-sans"
          style={{ background: "hsl(var(--green))", color: "white" }}
        >
          Book Now
        </motion.button>
      )}
    </motion.div>
  );
};

export default DoctorCard;

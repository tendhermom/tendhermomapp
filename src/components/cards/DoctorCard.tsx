import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface DoctorCardProps {
  name: string;
  initials: string;
  specialty: string;
  rating: number;
  experience: string;
  available: boolean;
  fee: string;
  onBook?: () => void;
}

const DoctorCard = ({
  name,
  initials,
  specialty,
  rating,
  experience,
  available,
  fee,
  onBook,
}: DoctorCardProps) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="tend-card p-[20px]"
    >
      <div className="flex items-start gap-3.5">
        <div
          className="w-[50px] h-[50px] rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: "hsl(var(--light-green))",
          }}
        >
          <span className="text-[15px] font-bold font-sans" style={{ color: "hsl(var(--green))" }}>
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-dark text-[15px] font-semibold font-sans truncate">{name}</h4>
          <p className="text-text-muted text-[13px] font-sans mt-0.5">{specialty}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <IonIcon name="star" size={13} style={{ color: "#F5A623" }} />
              <span className="text-dark text-[12px] font-semibold font-sans">{rating}</span>
            </div>
            <span className="text-text-muted text-[12px] font-sans">{experience}</span>
            {available && (
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
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onBook}
        className="w-full mt-4 py-[14px] rounded-2xl text-[15px] font-bold font-sans"
        style={{
          background: "hsl(var(--green))",
          color: "white",
        }}
      >
        Book Now
      </motion.button>
    </motion.div>
  );
};

export default DoctorCard;
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
      className="ios-card p-4"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-[48px] h-[48px] rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, hsla(153, 42%, 30%, 0.12), hsla(140, 24%, 55%, 0.12))",
          }}
        >
          <span className="text-[14px] font-bold" style={{ color: "hsl(var(--forest))" }}>
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="ios-body font-semibold text-foreground truncate">{name}</h4>
          <p className="ios-footnote text-muted-foreground mt-0.5">{specialty}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1">
              <IonIcon name="star" size={13} style={{ color: "#F5A623" }} />
              <span className="ios-caption font-semibold text-foreground">{rating}</span>
            </div>
            <span className="ios-caption text-muted-foreground">{experience}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="ios-body font-bold text-foreground">{fee}</p>
          {available && (
            <span
              className="ios-caption font-medium mt-1 inline-flex items-center gap-1"
              style={{ color: "hsl(var(--forest))" }}
            >
              <span className="w-[6px] h-[6px] rounded-full inline-block" style={{ background: "hsl(var(--forest))" }} />
              Available
            </span>
          )}
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onBook}
        className="w-full mt-4 py-[13px] rounded-xl ios-title text-[15px]"
        style={{
          background: "hsl(var(--forest))",
          color: "white",
          fontWeight: 600,
        }}
      >
        Book Consultation
      </motion.button>
    </motion.div>
  );
};

export default DoctorCard;

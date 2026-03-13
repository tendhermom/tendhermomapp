import { Star } from "lucide-react";
import { motion } from "framer-motion";

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
      whileTap={{ y: -2 }}
      className="bg-card rounded-xl card-shadow p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-primary">{initials}</span>
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-semibold text-foreground">{name}</h4>
          <p className="text-xs text-muted-foreground">{specialty}</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-medium text-foreground">
                {rating}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{experience}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {available && (
                <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Available Today
                </span>
              )}
              <span className="text-xs font-semibold text-foreground">
                {fee}
              </span>
            </div>
          </div>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onBook}
        className="w-full mt-3 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-lg"
      >
        Book Now
      </motion.button>
    </motion.div>
  );
};

export default DoctorCard;

import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface CommunityCardProps {
  title: string;
  pill: string;
  preview: string;
  members?: number;
  onClick?: () => void;
}

const CommunityCard = ({ title, pill, preview, members, onClick }: CommunityCardProps) => {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="tend-card cursor-pointer flex overflow-hidden min-w-[240px]"
    >
      <div className="w-[4px] flex-shrink-0 rounded-l-lg" style={{ background: "hsl(var(--green))" }} />
      <div className="p-[18px] space-y-2 flex-1">
        <span
          className="label-caps px-2.5 py-[4px] rounded-full inline-block"
          style={{
            background: "hsl(var(--light-green))",
            color: "hsl(var(--green))",
          }}
        >
          {pill}
        </span>
        <h4 className="text-[15px] font-semibold text-dark leading-tight font-sans">{title}</h4>
        <p className="text-[13px] text-text-muted line-clamp-2 font-sans">{preview}</p>
        {members && (
          <div className="flex items-center gap-1.5">
            <IonIcon name="people" size={13} style={{ color: "hsl(var(--text-muted))" }} />
            <p className="text-[11px] text-text-muted font-sans">
              {members.toLocaleString()} members
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CommunityCard;
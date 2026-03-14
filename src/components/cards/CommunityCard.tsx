import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface CommunityCardProps {
  title: string;
  pill: string;
  preview: string;
  members?: number;
  authorName?: string;
  isPremium?: boolean;
  isExpert?: boolean;
  onClick?: () => void;
}

const CommunityCard = ({ title, pill, preview, members, authorName, isPremium, isExpert, onClick }: CommunityCardProps) => {
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
        {authorName && (
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-dark font-sans">{authorName}</span>
            {isPremium && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="10" fill="hsl(var(--coral))" stroke="none"/>
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {isExpert && (
              <div
                className="w-[16px] h-[16px] rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--light-green))" }}
              >
                <IonIcon name="medkit" size={9} style={{ color: "hsl(var(--green))" }} />
              </div>
            )}
          </div>
        )}
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

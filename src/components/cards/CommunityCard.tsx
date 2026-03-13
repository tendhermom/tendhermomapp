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
      className="ios-card cursor-pointer flex overflow-hidden min-w-[250px]"
    >
      <div className="w-[3px] flex-shrink-0" style={{ background: "hsl(var(--forest))" }} />
      <div className="p-4 space-y-2 flex-1">
        <span
          className="ios-caption font-semibold px-2 py-[3px] rounded-full inline-block"
          style={{
            background: "hsla(153, 42%, 30%, 0.08)",
            color: "hsl(var(--forest))",
          }}
        >
          {pill}
        </span>
        <h4 className="text-[15px] font-semibold text-foreground leading-tight">{title}</h4>
        <p className="ios-footnote text-muted-foreground line-clamp-2">{preview}</p>
        {members && (
          <div className="flex items-center gap-1">
            <IonIcon name="people" size={12} style={{ color: "hsl(var(--text-tertiary))" }} />
            <p className="ios-caption text-muted-foreground">
              {members.toLocaleString()} members
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CommunityCard;

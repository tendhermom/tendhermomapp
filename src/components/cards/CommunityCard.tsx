import { motion } from "framer-motion";

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
      whileTap={{ y: -2 }}
      onClick={onClick}
      className="bg-card rounded-xl card-shadow flex overflow-hidden cursor-pointer min-w-[260px]"
    >
      <div className="w-1 bg-primary flex-shrink-0" />
      <div className="p-4 space-y-2 flex-1">
        <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {pill}
        </span>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2">{preview}</p>
        {members && (
          <p className="text-[10px] text-muted-foreground">
            {members.toLocaleString()} members
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default CommunityCard;

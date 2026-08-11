import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import IonIcon from "@/components/IonIcon";

interface SimpleBackHeaderProps {
  title: string;
  onBack: () => void;
  subtitle?: ReactNode;
  right?: ReactNode;
  titleRight?: ReactNode;
  className?: string;
  titleClassName?: string;
  variants?: Variants;
  icon?: string;
  iconSize?: number;
}

const SimpleBackHeader = ({
  title,
  onBack,
  subtitle,
  right,
  titleRight,
  className,
  titleClassName,
  variants,
  icon = "chevron-back",
  iconSize = 22,
}: SimpleBackHeaderProps) => {
  return (
    <motion.div
      variants={variants}
      className={cn("flex items-center gap-3", className)}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        className="w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0"
        style={{ background: "hsl(var(--light-green))" }}
      >
        <IonIcon
          name={icon}
          size={iconSize}
          style={{ color: "hsl(var(--green))" }}
        />
      </motion.button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1
            className={cn(
              "font-serif text-[22px] tracking-[-0.01em]",
              titleClassName
            )}
            style={{ color: "hsl(var(--dark))" }}
          >
            {title}
          </h1>
          {titleRight}
        </div>
        {subtitle && (
          <p
            className="text-[12px] font-sans truncate"
            style={{ color: "hsl(var(--text-muted))" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {right && (
        <div className="ml-auto flex items-center gap-2 shrink-0">{right}</div>
      )}
    </motion.div>
  );
};

export default SimpleBackHeader;

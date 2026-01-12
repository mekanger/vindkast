import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";

interface SeaCurrentBadgeProps {
  speed: number; // cm/s
  direction?: number; // degrees (oceanographic convention: direction current is flowing TO)
  className?: string;
}

export const SeaCurrentBadge = ({ speed, direction, className }: SeaCurrentBadgeProps) => {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400",
      className
    )}>
      <span>{speed}</span>
      {direction != null && (
        <ArrowUp 
          className="w-3 h-3 transition-transform duration-300"
          style={{ transform: `rotate(${direction}deg)` }}
        />
      )}
    </span>
  );
};
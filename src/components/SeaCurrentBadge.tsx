import { cn } from "@/lib/utils";
import { Waves } from "lucide-react";

interface SeaCurrentBadgeProps {
  speed: number; // cm/s
  className?: string;
}

export const SeaCurrentBadge = ({ speed, className }: SeaCurrentBadgeProps) => {
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs text-sky-600 dark:text-sky-400",
      className
    )}>
      <Waves className="w-2.5 h-2.5" />
      <span>{speed}</span>
    </span>
  );
};
import { cn } from "@/lib/utils";
import { Wind } from "lucide-react";

interface GustBadgeProps {
  gust: number;
  className?: string;
}

export const GustBadge = ({ gust, className }: GustBadgeProps) => {
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs text-muted-foreground",
      className
    )}>
      <Wind className="w-2.5 h-2.5" />
      <span>{gust.toFixed(1)}</span>
    </span>
  );
};
import { cn } from "@/lib/utils";

interface GustBadgeProps {
  gust: number;
  className?: string;
}

export const GustBadge = ({ gust, className }: GustBadgeProps) => {
  return (
    <span className={cn(
      "inline-flex items-center text-xs text-muted-foreground",
      className
    )}>
      {gust.toFixed(1)}
    </span>
  );
};
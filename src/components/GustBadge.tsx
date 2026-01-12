import { cn } from "@/lib/utils";

interface GustBadgeProps {
  gust: number;
  className?: string;
  size?: "sm" | "md";
}

const getGustLevel = (speed: number) => {
  if (speed < 5) return { level: "light", color: "bg-wind-light text-foreground" };
  if (speed < 10) return { level: "medium", color: "bg-wind-medium text-foreground" };
  if (speed < 15) return { level: "strong", color: "bg-wind-strong text-primary-foreground" };
  return { level: "extreme", color: "bg-wind-extreme text-primary-foreground" };
};

export const GustBadge = ({ gust, className, size = "sm" }: GustBadgeProps) => {
  const { color } = getGustLevel(gust);
  
  const sizeClasses = size === "sm" 
    ? "px-1.5 py-0.5 rounded text-xs min-w-[2.5rem]"
    : "px-2 py-1 rounded-md text-sm min-w-[3.5rem]";
  
  return (
    <span className={cn(
      "inline-flex items-center justify-center font-medium",
      sizeClasses,
      color,
      className
    )}>
      {gust.toFixed(1)}
    </span>
  );
};
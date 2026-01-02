import { cn } from "@/lib/utils";

interface WindSpeedBadgeProps {
  speed: number;
  className?: string;
}

const getWindLevel = (speed: number) => {
  if (speed < 5) return { level: "light", label: "Svak", color: "bg-wind-light text-foreground" };
  if (speed < 10) return { level: "medium", label: "Moderat", color: "bg-wind-medium text-foreground" };
  if (speed < 15) return { level: "strong", label: "Frisk", color: "bg-wind-strong text-primary-foreground" };
  return { level: "extreme", label: "Sterk", color: "bg-wind-extreme text-primary-foreground" };
};

export const WindSpeedBadge = ({ speed, className }: WindSpeedBadgeProps) => {
  const { color } = getWindLevel(speed);
  
  return (
    <span className={cn(
      "inline-flex items-center justify-center px-2 py-1 rounded-md text-sm font-medium min-w-[3.5rem]",
      color,
      className
    )}>
      {speed.toFixed(1)} m/s
    </span>
  );
};

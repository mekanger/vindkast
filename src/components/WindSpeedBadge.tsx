import { cn } from "@/lib/utils";

interface WindSpeedBadgeProps {
  speed: number;
  gust: number;
  className?: string;
  size?: "sm" | "md";
}

const getWindColorByGust = (gust: number): { bg: string; text: string } => {
  if (gust < 5) return { bg: "bg-wind-0", text: "text-foreground" };
  if (gust < 10) return { bg: "bg-wind-5", text: "text-foreground" };
  if (gust < 15) return { bg: "bg-wind-10", text: "text-primary-foreground" };
  if (gust < 20) return { bg: "bg-wind-15", text: "text-primary-foreground" };
  if (gust < 25) return { bg: "bg-wind-20", text: "text-primary-foreground" };
  return { bg: "bg-wind-25", text: "text-primary-foreground" };
};

export const WindSpeedBadge = ({ speed, gust, className, size = "md" }: WindSpeedBadgeProps) => {
  const { bg, text } = getWindColorByGust(gust);
  
  const sizeClasses = size === "sm" 
    ? "px-1.5 py-0.5 rounded text-xs min-w-[2.5rem]"
    : "px-2 py-1 rounded-md text-sm min-w-[3.5rem]";
  
  return (
    <span className={cn(
      "inline-flex items-center justify-center font-medium",
      sizeClasses,
      bg,
      text,
      className
    )}>
      {speed.toFixed(1)}
    </span>
  );
};

import { cn } from "@/lib/utils";
import type { WindUnit } from "@/types/settings";
import { convertWindSpeed } from "@/types/settings";

interface WindSpeedBadgeProps {
  speed: number;
  gust: number;
  className?: string;
  size?: "sm" | "md";
  unit?: WindUnit;
}

// Color thresholds are always based on m/s values
const getWindColorByGust = (gustMs: number): { bg: string; text: string } => {
  if (gustMs < 5) return { bg: "bg-wind-0", text: "text-foreground" };
  if (gustMs < 10) return { bg: "bg-wind-5", text: "text-foreground" };
  if (gustMs < 15) return { bg: "bg-wind-10", text: "text-primary-foreground" };
  if (gustMs < 20) return { bg: "bg-wind-15", text: "text-primary-foreground" };
  if (gustMs < 25) return { bg: "bg-wind-20", text: "text-primary-foreground" };
  return { bg: "bg-wind-25", text: "text-primary-foreground" };
};

export const WindSpeedBadge = ({ speed, gust, className, size = "md", unit = "ms" }: WindSpeedBadgeProps) => {
  // Color is always based on original m/s value
  const { bg, text } = getWindColorByGust(gust);
  
  // Convert display value based on unit
  const displayValue = convertWindSpeed(speed, unit);
  
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
      {Math.round(displayValue)}
    </span>
  );
};

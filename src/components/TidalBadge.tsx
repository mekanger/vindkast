import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TidalBadgeProps {
  height: number; // cm
  previousHeight?: number; // cm - previous hour's height for trend
}

export const TidalBadge = ({ height, previousHeight }: TidalBadgeProps) => {
  // Determine trend based on previous value
  const getTrend = () => {
    if (previousHeight === undefined) return "stable";
    const diff = height - previousHeight;
    if (diff > 2) return "rising"; // Rising if more than 2cm difference
    if (diff < -2) return "falling"; // Falling if less than -2cm difference
    return "stable";
  };

  const trend = getTrend();

  const TrendIcon = trend === "rising" ? TrendingUp : trend === "falling" ? TrendingDown : Minus;
  const trendColor = trend === "rising" ? "text-teal-500" : trend === "falling" ? "text-blue-400" : "text-muted-foreground";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <TrendIcon className={`w-3 h-3 ${trendColor}`} />
      <span className="text-xs font-medium tabular-nums text-foreground">
        {height > 0 ? "+" : ""}{Math.round(height)}
      </span>
    </div>
  );
};


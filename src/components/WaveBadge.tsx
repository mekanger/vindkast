import { Waves } from "lucide-react";
import { WindDirectionIcon } from "./WindDirectionIcon";

interface WaveBadgeProps {
  height: number; // meters
  direction?: number;
}

export const WaveBadge = ({ height, direction }: WaveBadgeProps) => {
  // Color coding based on wave height
  const getColorClass = () => {
    if (height < 0.5) return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
    if (height < 1.0) return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
    if (height < 1.5) return "bg-orange-500/20 text-orange-600 dark:text-orange-400";
    return "bg-red-500/20 text-red-600 dark:text-red-400";
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${getColorClass()}`}>
        {height.toFixed(1)}
      </div>
      {direction !== undefined && (
        <WindDirectionIcon
          direction={direction}
          className="w-3 h-3 text-muted-foreground"
        />
      )}
    </div>
  );
};
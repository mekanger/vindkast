import { Waves } from "lucide-react";

interface TidalBadgeProps {
  height: number; // cm relative to chart datum
}

export const TidalBadge = ({ height }: TidalBadgeProps) => {
  // Determine color based on tidal height
  // Negative values = low tide, positive values = high tide
  const getColorClass = () => {
    if (height < -50) return "text-blue-400"; // Very low tide
    if (height < 0) return "text-blue-300"; // Low tide
    if (height < 50) return "text-cyan-400"; // Near mean level
    if (height < 100) return "text-teal-400"; // Rising/high tide
    return "text-teal-500"; // Very high tide
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <Waves className={`w-3 h-3 ${getColorClass()}`} />
      <span className={`text-xs font-medium ${getColorClass()}`}>
        {height > 0 ? '+' : ''}{Math.round(height)}
      </span>
    </div>
  );
};

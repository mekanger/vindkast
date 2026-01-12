import { cn } from "@/lib/utils";

interface SeaCurrentBadgeProps {
  speed: number; // cm/s
  direction?: number; // degrees (oceanographic convention: direction current is flowing TO)
  className?: string;
}

const getDirectionLabel = (degrees: number): string => {
  // Oceanographic convention: direction current is flowing TO
  // We convert to compass direction
  const normalized = ((degrees % 360) + 360) % 360;
  
  if (normalized >= 337.5 || normalized < 22.5) return "N";
  if (normalized >= 22.5 && normalized < 67.5) return "NØ";
  if (normalized >= 67.5 && normalized < 112.5) return "Ø";
  if (normalized >= 112.5 && normalized < 157.5) return "SØ";
  if (normalized >= 157.5 && normalized < 202.5) return "S";
  if (normalized >= 202.5 && normalized < 247.5) return "SV";
  if (normalized >= 247.5 && normalized < 292.5) return "V";
  if (normalized >= 292.5 && normalized < 337.5) return "NV";
  return "N";
};

export const SeaCurrentBadge = ({ speed, direction, className }: SeaCurrentBadgeProps) => {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400",
      className
    )}>
      <span>{speed}</span>
      {direction != null && (
        <span className="text-sky-500 dark:text-sky-300 font-medium">
          {getDirectionLabel(direction)}
        </span>
      )}
    </span>
  );
};
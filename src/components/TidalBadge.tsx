import { Waves } from "lucide-react";

interface TidalBadgeProps {
  height: number; // cm
}

export const TidalBadge = ({ height }: TidalBadgeProps) => {
  // Keep styling semantic (design tokens) and simple; value is what matters.
  const valueClass = height >= 0 ? "text-primary" : "text-foreground";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <Waves className="w-3 h-3 text-muted-foreground" />
      <span className={`text-xs font-medium tabular-nums ${valueClass}`}>
        {height > 0 ? "+" : ""}{Math.round(height)}
      </span>
    </div>
  );
};


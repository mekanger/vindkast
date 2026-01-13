import { cn } from "@/lib/utils";

interface TemperatureBadgeProps {
  temperature: number;
  className?: string;
}

export const TemperatureBadge = ({ temperature, className }: TemperatureBadgeProps) => {
  const getTemperatureColor = (temp: number) => {
    if (temp <= 0) return "text-blue-500";
    if (temp <= 10) return "text-cyan-500";
    if (temp <= 18) return "text-green-500";
    if (temp <= 25) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <span className={cn("text-xs font-medium", getTemperatureColor(temperature), className)}>
      {Math.round(temperature)}°
    </span>
  );
};

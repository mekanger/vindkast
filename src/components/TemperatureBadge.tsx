import { cn } from "@/lib/utils";

interface TemperatureBadgeProps {
  temperature: number;
  className?: string;
}

export const TemperatureBadge = ({ temperature, className }: TemperatureBadgeProps) => {
  const getTemperatureColor = (temp: number) => {
    if (temp < 0) {
      // Negative temperatures: blue tones (darker blue for colder)
      if (temp <= -10) return "text-blue-700";
      if (temp <= -5) return "text-blue-600";
      return "text-blue-500";
    } else {
      // Positive temperatures: red tones (darker red for warmer)
      if (temp >= 25) return "text-red-600";
      if (temp >= 15) return "text-red-500";
      if (temp >= 5) return "text-orange-500";
      return "text-orange-400";
    }
  };

  return (
    <span className={cn("text-xs font-medium", getTemperatureColor(temperature), className)}>
      {Math.round(temperature)}°
    </span>
  );
};

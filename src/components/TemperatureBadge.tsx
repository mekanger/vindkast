import { cn } from "@/lib/utils";

interface TemperatureBadgeProps {
  temperature: number;
  className?: string;
}

export const TemperatureBadge = ({ temperature, className }: TemperatureBadgeProps) => {
  const getTemperatureColor = (temp: number) => {
    if (temp < 0) {
      // Negative temperatures: blue tones (darker blue for colder)
      if (temp <= -10) return "text-temp-cold-strong";
      if (temp <= -5) return "text-temp-cold";
      return "text-temp-cool";
    }

    if (temp === 0) return "text-muted-foreground";

    // Positive temperatures: red tones (darker red for warmer)
    if (temp >= 25) return "text-temp-hot-strong";
    if (temp >= 15) return "text-temp-hot";
    return "text-temp-warm";
  };

  return (
    <span className={cn("text-xs font-medium", getTemperatureColor(temperature), className)}>
      {Math.round(temperature)}°
    </span>
  );
};

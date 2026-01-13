import { useMemo, useState } from "react";

interface WeatherIconProps {
  symbolCode: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const WeatherIcon = ({ symbolCode, size = "md", className = "" }: WeatherIconProps) => {
  const [failed, setFailed] = useState(false);

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const iconUrl = useMemo(() => {
    // Official MET icon set where filename corresponds to `symbol_code`
    // Source: https://github.com/metno/weathericons
    return `https://raw.githubusercontent.com/metno/weathericons/main/weather/svg/${symbolCode}.svg`;
  }, [symbolCode]);

  if (failed) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  return (
    <img
      src={iconUrl}
      alt={symbolCode.replace(/_/g, " ")}
      className={`${sizeClasses[size]} ${className}`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
};

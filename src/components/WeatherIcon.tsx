interface WeatherIconProps {
  symbolCode: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const WeatherIcon = ({ symbolCode, size = "md", className = "" }: WeatherIconProps) => {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  // Use Yr's official weather symbols from NRK's GitHub
  const iconUrl = `https://raw.githubusercontent.com/nrkno/yr-weather-symbols/refs/heads/master/dist/svg/${symbolCode}.svg`;

  return (
    <img
      src={iconUrl}
      alt={symbolCode.replace(/_/g, " ")}
      className={`${sizeClasses[size]} ${className}`}
      loading="lazy"
      onError={(e) => {
        // Hide image if it fails to load
        e.currentTarget.style.display = "none";
      }}
    />
  );
};

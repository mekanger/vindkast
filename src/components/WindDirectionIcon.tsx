import { ArrowDown } from "lucide-react";

interface WindDirectionIconProps {
  direction: number;
  className?: string;
}

// Direction is "wind_from_direction" from yr.no - the direction the wind is coming FROM
// ArrowDown pointing in the direction the wind is coming FROM (meteorological convention)
export const WindDirectionIcon = ({ direction, className = "" }: WindDirectionIconProps) => {
  return (
    <ArrowDown 
      className={`transition-transform duration-300 ${className}`}
      style={{ transform: `rotate(${direction}deg)` }}
    />
  );
};

import { ArrowUp } from "lucide-react";

interface WindDirectionIconProps {
  direction: number;
  className?: string;
}

export const WindDirectionIcon = ({ direction, className = "" }: WindDirectionIconProps) => {
  return (
    <ArrowUp 
      className={`transition-transform duration-300 ${className}`}
      style={{ transform: `rotate(${direction}deg)` }}
    />
  );
};

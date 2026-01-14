interface TidalIconProps {
  type: 'high' | 'low';
  className?: string;
}

export const TidalIcon = ({ type, className = "w-4 h-4" }: TidalIconProps) => {
  if (type === 'high') {
    // High tide: fuller wave with higher water level
    return (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={className}
      >
        {/* Water level line - high */}
        <rect x="2" y="16" width="20" height="6" fill="currentColor" opacity="0.2" stroke="none" />
        {/* Wave pattern - tall waves */}
        <path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
        <path d="M2 16c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />
        {/* Arrow up indicator */}
        <path d="M12 3v5" />
        <path d="M9 5l3-3 3 3" />
      </svg>
    );
  }
  
  // Low tide: smaller wave with lower water level
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      {/* Water level line - low */}
      <rect x="2" y="20" width="20" height="2" fill="currentColor" opacity="0.2" stroke="none" />
      {/* Wave pattern - small waves */}
      <path d="M2 18c2-0.5 4-0.5 6 0s4 0.5 6 0 4-0.5 6 0" />
      {/* Arrow down indicator */}
      <path d="M12 3v5" />
      <path d="M9 6l3 3 3-3" />
    </svg>
  );
};

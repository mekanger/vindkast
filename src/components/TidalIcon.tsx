interface TidalIconProps {
  type: 'high' | 'low';
  className?: string;
}

export const TidalIcon = ({ type, className = "w-4 h-4" }: TidalIconProps) => {
  if (type === 'high') {
    // High tide: 4 waves stacked
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
        {/* 4 wave lines for high tide */}
        <path d="M2 6c2.5-1.5 5-1.5 7.5 0s5 1.5 7.5 0 5-1.5 7.5 0" />
        <path d="M2 10c2.5-1.5 5-1.5 7.5 0s5 1.5 7.5 0 5-1.5 7.5 0" />
        <path d="M2 14c2.5-1.5 5-1.5 7.5 0s5 1.5 7.5 0 5-1.5 7.5 0" />
        <path d="M2 18c2.5-1.5 5-1.5 7.5 0s5 1.5 7.5 0 5-1.5 7.5 0" />
      </svg>
    );
  }
  
  // Low tide: 2 waves
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
      {/* 2 wave lines for low tide */}
      <path d="M2 12c2.5-1.5 5-1.5 7.5 0s5 1.5 7.5 0 5-1.5 7.5 0" />
      <path d="M2 16c2.5-1.5 5-1.5 7.5 0s5 1.5 7.5 0 5-1.5 7.5 0" />
    </svg>
  );
};

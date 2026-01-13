import type { ActivityType } from '@/types/activity';
import { ACTIVITY_LABELS } from '@/types/activity';

import windsurfingImg from '@/assets/activities/windsurfing.png';
import windfoilImg from '@/assets/activities/windfoil.png';
import wingfoilImg from '@/assets/activities/wingfoil.png';
import supfoilImg from '@/assets/activities/sup-foil.png';

const ACTIVITY_IMAGES: Record<ActivityType, string> = {
  'windsurfing': windsurfingImg,
  'windfoil': windfoilImg,
  'wingfoil': wingfoilImg,
  'sup-foil': supfoilImg,
};

interface DailyActivityBadgeProps {
  activity: ActivityType;
  locationName: string;
}

export const DailyActivityBadge = ({ activity, locationName }: DailyActivityBadgeProps) => {
  return (
    <div className="w-full sm:w-[340px] flex-shrink-0 bg-primary/10 border border-primary/20 rounded-lg p-4">
      <div className="flex items-center gap-4">
        <img
          src={ACTIVITY_IMAGES[activity]}
          alt={ACTIVITY_LABELS[activity]}
          loading="lazy"
          decoding="async"
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Dagens aktivitet
          </p>
          <p className="text-lg font-semibold text-foreground truncate">
            {ACTIVITY_LABELS[activity]}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            @ {locationName}
          </p>
        </div>
      </div>
    </div>
  );
};


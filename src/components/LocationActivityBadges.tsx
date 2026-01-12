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

interface LocationActivityBadgesProps {
  activities: ActivityType[];
}

export const LocationActivityBadges = ({ activities }: LocationActivityBadgesProps) => {
  if (activities.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {activities.map((activity) => (
        <div
          key={activity}
          className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-2 py-1"
        >
          <img
            src={ACTIVITY_IMAGES[activity]}
            alt={ACTIVITY_LABELS[activity]}
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="text-xs font-medium text-foreground">
            {ACTIVITY_LABELS[activity]}
          </span>
        </div>
      ))}
    </div>
  );
};

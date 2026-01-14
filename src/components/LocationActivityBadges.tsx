import type { ActivityType } from '@/types/activity';
import { ACTIVITY_LABELS } from '@/types/activity';

import windsurfingImg from '@/assets/activities/windsurfing.png';
import windfoilImg from '@/assets/activities/windfoil.png';
import wingfoilImg from '@/assets/activities/wingfoil.png';
import supfoilImg from '@/assets/activities/sup-foil.png';
import kitingImg from '@/assets/activities/kiting.png';
import supImg from '@/assets/activities/sup.png';

const ACTIVITY_IMAGES: Record<ActivityType, string> = {
  'windsurfing': windsurfingImg,
  'windfoil': windfoilImg,
  'wingfoil': wingfoilImg,
  'sup-foil': supfoilImg,
  'kiting': kitingImg,
  'sup': supImg,
};

interface LocationActivityBadgesProps {
  activities: ActivityType[];
}

export const LocationActivityBadges = ({ activities }: LocationActivityBadgesProps) => {
  if (activities.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {activities.map((activity) => (
        <img
          key={activity}
          src={ACTIVITY_IMAGES[activity]}
          alt={ACTIVITY_LABELS[activity]}
          title={ACTIVITY_LABELS[activity]}
          className="w-8 h-8 rounded-full object-cover border border-primary/20"
        />
      ))}
    </div>
  );
};

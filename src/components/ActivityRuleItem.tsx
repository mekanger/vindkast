import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActivityRule } from '@/types/activity';
import { ACTIVITY_LABELS, WIND_DIRECTION_LABELS } from '@/types/activity';
import { useUserSettings } from '@/hooks/useUserSettings';
import { convertWindSpeed, getWindUnitLabel } from '@/types/settings';

import windsurfingImg from '@/assets/activities/windsurfing.png';
import windfoilImg from '@/assets/activities/windfoil.png';
import wingfoilImg from '@/assets/activities/wingfoil.png';
import supfoilImg from '@/assets/activities/sup-foil.png';

const ACTIVITY_IMAGES: Record<string, string> = {
  'windsurfing': windsurfingImg,
  'windfoil': windfoilImg,
  'wingfoil': wingfoilImg,
  'sup-foil': supfoilImg,
};

interface ActivityRuleItemProps {
  rule: ActivityRule;
  onEdit: (rule: ActivityRule) => void;
  onDelete: (id: string) => void;
}

export const ActivityRuleItem = ({ rule, onEdit, onDelete }: ActivityRuleItemProps) => {
  const { windUnit } = useUserSettings();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const minDisplay = rule.min_gust !== null ? convertWindSpeed(rule.min_gust, windUnit).toFixed(0) : null;
  const maxDisplay = rule.max_gust !== null ? convertWindSpeed(rule.max_gust, windUnit).toFixed(0) : null;
  const unitLabel = getWindUnitLabel(windUnit);

  // Format gust display based on which values are set
  const gustDisplay = () => {
    if (minDisplay !== null && maxDisplay !== null) {
      return `${minDisplay}-${maxDisplay} ${unitLabel}`;
    } else if (minDisplay !== null) {
      return `≥${minDisplay} ${unitLabel}`;
    } else if (maxDisplay !== null) {
      return `≤${maxDisplay} ${unitLabel}`;
    }
    return null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <img
        src={ACTIVITY_IMAGES[rule.activity]}
        alt={ACTIVITY_LABELS[rule.activity]}
        className="w-10 h-10 rounded object-cover"
      />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {ACTIVITY_LABELS[rule.activity]}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {rule.location_name}
          {gustDisplay() && ` • ${gustDisplay()}`}
          {(rule.min_temp !== null || rule.max_temp !== null) && (
            <span>
              {' • '}
              {rule.min_temp !== null && rule.max_temp !== null
                ? `${rule.min_temp}-${rule.max_temp}°C`
                : rule.min_temp !== null
                  ? `≥${rule.min_temp}°C`
                  : `≤${rule.max_temp}°C`
              }
            </span>
          )}
          {rule.wind_directions && rule.wind_directions.length > 0 && (
            <span> • {rule.wind_directions.map(d => WIND_DIRECTION_LABELS[d]).join(', ')}</span>
          )}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(rule)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Pencil className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(rule.id)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

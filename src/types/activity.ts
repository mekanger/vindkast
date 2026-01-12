export type ActivityType = 'windsurfing' | 'windfoil' | 'wingfoil' | 'sup-foil';

export interface ActivityRule {
  id: string;
  user_id: string;
  location_id: string;
  location_name: string;
  activity: ActivityType;
  min_gust: number;
  max_gust: number;
  priority: number;
  created_at: string;
}

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  'windsurfing': 'Windsurfing',
  'windfoil': 'Windfoil',
  'wingfoil': 'Wingfoil',
  'sup-foil': 'SUP-foil',
};

export const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'windsurfing', label: 'Windsurfing' },
  { value: 'windfoil', label: 'Windfoil' },
  { value: 'wingfoil', label: 'Wingfoil' },
  { value: 'sup-foil', label: 'SUP-foil' },
];

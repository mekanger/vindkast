export type ActivityType = 'windsurfing' | 'windfoil' | 'wingfoil' | 'sup-foil' | 'kiting' | 'sup';

export type WindDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface ActivityRule {
  id: string;
  user_id: string;
  location_id: string;
  location_name: string;
  activity: ActivityType;
  min_gust: number | null;
  max_gust: number | null;
  priority: number;
  created_at: string;
  wind_directions: WindDirection[] | null;
  min_temp: number | null;
  max_temp: number | null;
}

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  'windsurfing': 'Windsurfing',
  'windfoil': 'Windfoil',
  'wingfoil': 'Wingfoil',
  'sup-foil': 'SUP-foil',
  'kiting': 'Kiting',
  'sup': 'SUP',
};

export const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'windsurfing', label: 'Windsurfing' },
  { value: 'windfoil', label: 'Windfoil' },
  { value: 'wingfoil', label: 'Wingfoil' },
  { value: 'sup-foil', label: 'SUP-foil' },
  { value: 'kiting', label: 'Kiting' },
  { value: 'sup', label: 'SUP' },
];

export const WIND_DIRECTION_OPTIONS: { value: WindDirection; label: string }[] = [
  { value: 'N', label: 'Nord' },
  { value: 'NE', label: 'Nord-øst' },
  { value: 'E', label: 'Øst' },
  { value: 'SE', label: 'Sør-øst' },
  { value: 'S', label: 'Sør' },
  { value: 'SW', label: 'Sør-vest' },
  { value: 'W', label: 'Vest' },
  { value: 'NW', label: 'Nord-vest' },
];

export const WIND_DIRECTION_LABELS: Record<WindDirection, string> = {
  'N': 'N',
  'NE': 'NØ',
  'E': 'Ø',
  'SE': 'SØ',
  'S': 'S',
  'SW': 'SV',
  'W': 'V',
  'NW': 'NV',
};

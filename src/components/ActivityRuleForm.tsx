import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ACTIVITY_OPTIONS, type ActivityType } from '@/types/activity';
import type { Location } from '@/types/weather';
import { Plus } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { getWindUnitLabel, MS_TO_KNOTS } from '@/types/settings';

interface ActivityRuleFormProps {
  locations: Location[];
  onSubmit: (rule: {
    location_id: string;
    location_name: string;
    activity: ActivityType;
    min_gust: number;
    max_gust: number;
  }) => Promise<{ error: Error | null }>;
}

export const ActivityRuleForm = ({ locations, onSubmit }: ActivityRuleFormProps) => {
  const { windUnit } = useUserSettings();
  const [locationId, setLocationId] = useState<string>('');
  const [activity, setActivity] = useState<ActivityType | ''>('');
  const [minGust, setMinGust] = useState<string>('');
  const [maxGust, setMaxGust] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedLocation = locations.find(l => l.id === locationId);
  const unitLabel = getWindUnitLabel(windUnit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationId || !activity || minGust === '' || maxGust === '' || !selectedLocation) return;

    const minGustNum = parseFloat(minGust);
    const maxGustNum = parseFloat(maxGust);

    if (isNaN(minGustNum) || isNaN(maxGustNum) || minGustNum < 0 || maxGustNum < 0 || minGustNum > maxGustNum) return;

    // Convert from display unit to m/s for storage
    const minGustMs = windUnit === 'knots' ? minGustNum / MS_TO_KNOTS : minGustNum;
    const maxGustMs = windUnit === 'knots' ? maxGustNum / MS_TO_KNOTS : maxGustNum;

    setIsSubmitting(true);
    
    const { error } = await onSubmit({
      location_id: locationId,
      location_name: selectedLocation.name,
      activity: activity as ActivityType,
      min_gust: minGustMs,
      max_gust: maxGustMs,
    });

    setIsSubmitting(false);

    if (!error) {
      // Reset form
      setLocationId('');
      setActivity('');
      setMinGust('');
      setMaxGust('');
    }
  };

  const isValid = locationId && activity && minGust !== '' && maxGust !== '' && 
    !isNaN(parseFloat(minGust)) && !isNaN(parseFloat(maxGust)) &&
    parseFloat(minGust) >= 0 && parseFloat(maxGust) >= 0 &&
    parseFloat(minGust) <= parseFloat(maxGust);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label htmlFor="location" className="text-sm font-medium">
            Sted
          </Label>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger id="location" className="mt-1">
              <SelectValue placeholder="Velg sted" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(location => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label htmlFor="activity" className="text-sm font-medium">
            Aktivitet
          </Label>
          <Select value={activity} onValueChange={(v) => setActivity(v as ActivityType)}>
            <SelectTrigger id="activity" className="mt-1">
              <SelectValue placeholder="Velg aktivitet" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="minGust" className="text-sm font-medium">
            Min vindkast ({unitLabel})
          </Label>
          <Input
            id="minGust"
            type="number"
            step="1"
            min="0"
            value={minGust}
            onChange={(e) => setMinGust(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="maxGust" className="text-sm font-medium">
            Max vindkast ({unitLabel})
          </Label>
          <Input
            id="maxGust"
            type="number"
            step="1"
            min="0"
            value={maxGust}
            onChange={(e) => setMaxGust(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={!isValid || isSubmitting}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Legg til regel
      </Button>
    </form>
  );
};

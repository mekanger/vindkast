import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { ACTIVITY_OPTIONS, type ActivityType, type ActivityRule } from '@/types/activity';
import type { Location } from '@/types/weather';
import { useUserSettings } from '@/hooks/useUserSettings';
import { getWindUnitLabel, convertWindSpeed, MS_TO_KNOTS } from '@/types/settings';

interface ActivityRuleEditDialogProps {
  rule: ActivityRule | null;
  locations: Location[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ruleId: string, updates: {
    location_id: string;
    location_name: string;
    activity: ActivityType;
    min_gust: number;
    max_gust: number;
  }) => Promise<{ error: Error | null }>;
}

export const ActivityRuleEditDialog = ({
  rule,
  locations,
  open,
  onOpenChange,
  onSave,
}: ActivityRuleEditDialogProps) => {
  const { windUnit } = useUserSettings();
  const [locationId, setLocationId] = useState<string>('');
  const [activity, setActivity] = useState<ActivityType | ''>('');
  const [minGust, setMinGust] = useState<string>('');
  const [maxGust, setMaxGust] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unitLabel = getWindUnitLabel(windUnit);

  // Populate form when rule changes
  useEffect(() => {
    if (rule) {
      setLocationId(rule.location_id);
      setActivity(rule.activity);
      // Convert from m/s to display unit
      const minDisplay = convertWindSpeed(rule.min_gust, windUnit);
      const maxDisplay = convertWindSpeed(rule.max_gust, windUnit);
      setMinGust(minDisplay.toFixed(1));
      setMaxGust(maxDisplay.toFixed(1));
    }
  }, [rule, windUnit]);

  const selectedLocation = locations.find(l => l.id === locationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rule || !locationId || !activity || minGust === '' || maxGust === '' || !selectedLocation) return;

    const minGustNum = parseFloat(minGust);
    const maxGustNum = parseFloat(maxGust);

    if (isNaN(minGustNum) || isNaN(maxGustNum) || minGustNum < 0 || maxGustNum < 0 || minGustNum > maxGustNum) return;

    // Convert from display unit to m/s for storage
    const minGustMs = windUnit === 'knots' ? minGustNum / MS_TO_KNOTS : minGustNum;
    const maxGustMs = windUnit === 'knots' ? maxGustNum / MS_TO_KNOTS : maxGustNum;

    setIsSubmitting(true);
    
    const { error } = await onSave(rule.id, {
      location_id: locationId,
      location_name: selectedLocation.name,
      activity: activity as ActivityType,
      min_gust: minGustMs,
      max_gust: maxGustMs,
    });

    setIsSubmitting(false);

    if (!error) {
      onOpenChange(false);
    }
  };

  const isValid = locationId && activity && minGust !== '' && maxGust !== '' && 
    !isNaN(parseFloat(minGust)) && !isNaN(parseFloat(maxGust)) &&
    parseFloat(minGust) >= 0 && parseFloat(maxGust) >= 0 &&
    parseFloat(minGust) <= parseFloat(maxGust);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rediger regel</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="edit-location" className="text-sm font-medium">
                Sted
              </Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger id="edit-location" className="mt-1">
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

            <div>
              <Label htmlFor="edit-activity" className="text-sm font-medium">
                Aktivitet
              </Label>
              <Select value={activity} onValueChange={(v) => setActivity(v as ActivityType)}>
                <SelectTrigger id="edit-activity" className="mt-1">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-minGust" className="text-sm font-medium">
                  Min vindkast ({unitLabel})
                </Label>
                <Input
                  id="edit-minGust"
                  type="number"
                  step="0.1"
                  min="0"
                  value={minGust}
                  onChange={(e) => setMinGust(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-maxGust" className="text-sm font-medium">
                  Max vindkast ({unitLabel})
                </Label>
                <Input
                  id="edit-maxGust"
                  type="number"
                  step="0.1"
                  min="0"
                  value={maxGust}
                  onChange={(e) => setMaxGust(e.target.value)}
                  placeholder="25"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Lagrer...' : 'Lagre'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

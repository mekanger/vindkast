import type { ActivityRule, ActivityType } from '@/types/activity';
import type { DayForecast, Location } from '@/types/weather';

const DISPLAY_HOURS = [10, 12, 14, 16];

interface LocationWithForecast {
  location: Location;
  forecast: DayForecast | undefined;
  isLoading: boolean;
}

/**
 * Get the maximum gust for a location on a specific date from a DayForecast
 */
export function getMaxGustForDay(forecast: DayForecast | undefined): number {
  if (!forecast) return 0;
  
  const relevantForecasts = forecast.forecasts.filter(f => DISPLAY_HOURS.includes(f.hour));
  
  if (relevantForecasts.length === 0) return 0;
  
  return Math.max(...relevantForecasts.map(f => f.windGust));
}

/**
 * Find the matching activity based on rules, location, and max gust
 * Rules are already sorted by priority (lowest number = highest priority)
 */
export function findMatchingActivity(
  rules: ActivityRule[],
  locationId: string,
  maxGust: number
): ActivityType | null {
  for (const rule of rules) {
    if (
      rule.location_id === locationId &&
      maxGust >= rule.min_gust &&
      maxGust <= rule.max_gust
    ) {
      return rule.activity;
    }
  }
  return null;
}

/**
 * Find the best activity for a day across all locations
 * Returns the first matching rule (highest priority) with its location
 */
export function findDailyActivity(
  rules: ActivityRule[],
  locationsWithForecasts: LocationWithForecast[]
): { activity: ActivityType; locationName: string; locationId: string } | null {
  // Rules should already be sorted by priority
  for (const rule of rules) {
    const locationData = locationsWithForecasts.find(
      lf => lf.location.id === rule.location_id
    );
    if (!locationData || !locationData.forecast) continue;
    
    const maxGust = getMaxGustForDay(locationData.forecast);
    
    if (maxGust >= rule.min_gust && maxGust <= rule.max_gust) {
      return {
        activity: rule.activity,
        locationName: rule.location_name,
        locationId: rule.location_id,
      };
    }
  }
  
  return null;
}

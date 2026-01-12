import type { ActivityRule, ActivityType, WindDirection } from '@/types/activity';
import type { DayForecast, Location } from '@/types/weather';

const ALL_DISPLAY_HOURS = [10, 12, 14, 16, 18, 20];

interface LocationWithForecast {
  location: Location;
  forecast: DayForecast | undefined;
  isLoading: boolean;
}

/**
 * Convert wind direction in degrees to compass direction
 */
function degreesToCompass(degrees: number): WindDirection {
  const directions: WindDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Check if a wind direction matches the allowed directions for a rule
 * If no directions are specified (null or empty), all directions match
 */
function matchesWindDirection(
  windDirectionDegrees: number,
  allowedDirections: WindDirection[] | null
): boolean {
  if (!allowedDirections || allowedDirections.length === 0) {
    return true; // No restriction, all directions match
  }
  const compass = degreesToCompass(windDirectionDegrees);
  return allowedDirections.includes(compass);
}

/**
 * Get the maximum gust for a location on a specific date from a DayForecast
 */
export function getMaxGustForDay(forecast: DayForecast | undefined): number {
  if (!forecast) return 0;
  
  const relevantForecasts = forecast.forecasts.filter(f => ALL_DISPLAY_HOURS.includes(f.hour));
  
  if (relevantForecasts.length === 0) return 0;
  
  return Math.max(...relevantForecasts.map(f => f.windGust));
}

/**
 * Check if any of the display hours has a gust value within the given range
 * and optionally matches the wind direction
 */
function hasMatchingConditions(
  forecast: DayForecast,
  minGust: number,
  maxGust: number,
  windDirections: WindDirection[] | null
): boolean {
  const relevantForecasts = forecast.forecasts.filter(f => ALL_DISPLAY_HOURS.includes(f.hour));
  
  return relevantForecasts.some(f => 
    f.windGust >= minGust && 
    f.windGust <= maxGust &&
    matchesWindDirection(f.windDirection, windDirections)
  );
}

/**
 * Find the matching activity based on rules, location, and forecast
 * Rules are already sorted by priority (lowest number = highest priority)
 * A rule matches if ANY of the display hours has conditions within the rule's range
 */
export function findMatchingActivity(
  rules: ActivityRule[],
  locationId: string,
  forecast: DayForecast | undefined
): ActivityType | null {
  if (!forecast) return null;
  
  for (const rule of rules) {
    if (
      rule.location_id === locationId &&
      hasMatchingConditions(forecast, rule.min_gust, rule.max_gust, rule.wind_directions)
    ) {
      return rule.activity;
    }
  }
  return null;
}

/**
 * Find all unique matching activities for a specific location
 * Returns an array of unique activity types that match the forecast
 */
export function findAllMatchingActivities(
  rules: ActivityRule[],
  locationId: string,
  forecast: DayForecast | undefined
): ActivityType[] {
  if (!forecast) return [];
  
  const matchingActivities = new Set<ActivityType>();
  
  for (const rule of rules) {
    if (
      rule.location_id === locationId &&
      hasMatchingConditions(forecast, rule.min_gust, rule.max_gust, rule.wind_directions)
    ) {
      matchingActivities.add(rule.activity);
    }
  }
  
  return Array.from(matchingActivities);
}

/**
 * Find the best activity for a day across all locations
 * Returns the first matching rule (highest priority) with its location
 * A rule matches if ANY of the display hours has conditions within the rule's range
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
    
    if (hasMatchingConditions(locationData.forecast, rule.min_gust, rule.max_gust, rule.wind_directions)) {
      return {
        activity: rule.activity,
        locationName: rule.location_name,
        locationId: rule.location_id,
      };
    }
  }
  
  return null;
}

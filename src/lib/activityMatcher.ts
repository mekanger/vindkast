import type { ActivityRule, ActivityType } from '@/types/activity';
import type { DayForecast, Location } from '@/types/weather';

const ALL_DISPLAY_HOURS = [10, 12, 14, 16];

interface LocationWithForecast {
  location: Location;
  forecast: DayForecast | undefined;
  isLoading: boolean;
}

/**
 * Get relevant display hours for a forecast date
 * Filters out hours more than 2 hours in the past for today
 */
function getRelevantHours(forecastDate: string): number[] {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // yyyy-MM-dd
  
  // Check if this is today's forecast by looking at the date portion
  // The date string from yr.no API comes as ISO date (yyyy-MM-dd)
  // But the formatted date from yrApi.ts is like "Søndag, 12. jan"
  // We need to handle both cases
  const isToday = forecastDate.includes(todayStr) || 
    forecastDate.toLowerCase().includes('i dag') ||
    // Match "Søndag, 12. jan" style dates against today
    (() => {
      try {
        const day = today.getDate();
        const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
        const month = months[today.getMonth()];
        return forecastDate.toLowerCase().includes(`${day}. ${month}`);
      } catch {
        return false;
      }
    })();
  
  if (!isToday) {
    return ALL_DISPLAY_HOURS;
  }
  
  const currentHour = today.getHours();
  const cutoffHour = currentHour - 2;
  
  return ALL_DISPLAY_HOURS.filter(hour => hour >= cutoffHour);
}

/**
 * Get the maximum gust for a location on a specific date from a DayForecast
 */
export function getMaxGustForDay(forecast: DayForecast | undefined): number {
  if (!forecast) return 0;
  
  const relevantHours = getRelevantHours(forecast.date);
  const relevantForecasts = forecast.forecasts.filter(f => relevantHours.includes(f.hour));
  
  if (relevantForecasts.length === 0) return 0;
  
  return Math.max(...relevantForecasts.map(f => f.windGust));
}

/**
 * Check if any of the relevant display hours has a gust value within the given range
 */
function hasMatchingGustInRange(
  forecast: DayForecast,
  minGust: number,
  maxGust: number
): boolean {
  const relevantHours = getRelevantHours(forecast.date);
  const relevantForecasts = forecast.forecasts.filter(f => relevantHours.includes(f.hour));
  
  return relevantForecasts.some(f => f.windGust >= minGust && f.windGust <= maxGust);
}

/**
 * Find the matching activity based on rules, location, and forecast
 * Rules are already sorted by priority (lowest number = highest priority)
 * A rule matches if ANY of the display hours has a gust within the rule's range
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
      hasMatchingGustInRange(forecast, rule.min_gust, rule.max_gust)
    ) {
      return rule.activity;
    }
  }
  return null;
}

/**
 * Find the best activity for a day across all locations
 * Returns the first matching rule (highest priority) with its location
 * A rule matches if ANY of the display hours has a gust within the rule's range
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
    
    if (hasMatchingGustInRange(locationData.forecast, rule.min_gust, rule.max_gust)) {
      return {
        activity: rule.activity,
        locationName: rule.location_name,
        locationId: rule.location_id,
      };
    }
  }
  
  return null;
}

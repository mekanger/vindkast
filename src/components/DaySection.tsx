import { Calendar, MapPin, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WindDirectionIcon } from "./WindDirectionIcon";
import { WindSpeedBadge } from "./WindSpeedBadge";
import { SeaCurrentBadge } from "./SeaCurrentBadge";
import { DailyActivityBadge } from "./DailyActivityBadge";
import { X } from "lucide-react";
import type { DayForecast, Location } from "@/types/weather";
import type { ActivityRule } from "@/types/activity";
import { findDailyActivity } from "@/lib/activityMatcher";
import { format, parseISO, isToday } from "date-fns";
import { nb } from "date-fns/locale";
import { useMemo } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { convertWindSpeed, getWindUnitLabel } from "@/types/settings";

interface DaySectionProps {
  date: string;
  locationsWithForecasts: {
    location: Location;
    forecast: DayForecast | undefined;
    isLoading: boolean;
  }[];
  onRemoveLocation: (id: string) => void;
  activityRules?: ActivityRule[];
}

const ALL_DISPLAY_HOURS = [10, 12, 14, 16];

/**
 * Get display hours, filtering out hours more than 2 hours in the past for today
 */
const getDisplayHours = (dateStr: string): number[] => {
  try {
    const date = parseISO(dateStr);
    if (!isToday(date)) {
      return ALL_DISPLAY_HOURS;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    // Show hours that are at most 2 hours in the past
    const cutoffHour = currentHour - 2;
    
    return ALL_DISPLAY_HOURS.filter(hour => hour >= cutoffHour);
  } catch {
    return ALL_DISPLAY_HOURS;
  }
};

const formatDateHeader = (dateStr: string): { dayName: string; dateFormatted: string; isoDate: string } => {
  try {
    const date = parseISO(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isTodayDate = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isTodayDate) {
      return { dayName: "I dag", dateFormatted: format(date, "d. MMMM", { locale: nb }), isoDate: format(date, "yyyy-MM-dd") };
    } else if (isTomorrow) {
      return { dayName: "I morgen", dateFormatted: format(date, "d. MMMM", { locale: nb }), isoDate: format(date, "yyyy-MM-dd") };
    } else {
      return { 
        dayName: format(date, "EEEE", { locale: nb }), 
        dateFormatted: format(date, "d. MMMM", { locale: nb }),
        isoDate: format(date, "yyyy-MM-dd")
      };
    }
  } catch {
    return { dayName: dateStr, dateFormatted: "", isoDate: "" };
  }
};

export const DaySection = ({ date, locationsWithForecasts, onRemoveLocation, activityRules = [] }: DaySectionProps) => {
  const { dayName, dateFormatted, isoDate } = formatDateHeader(date);
  const { windUnit } = useUserSettings();
  const unitLabel = getWindUnitLabel(windUnit);
  
  // Get display hours, filtering out past hours for today
  const displayHours = useMemo(() => getDisplayHours(isoDate), [isoDate]);

  // Find the recommended activity for this day
  const dailyActivity = useMemo(() => {
    if (activityRules.length === 0) return null;
    return findDailyActivity(activityRules, locationsWithForecasts);
  }, [activityRules, locationsWithForecasts]);

  return (
    <section className="space-y-4">
      {/* Day Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="p-2 rounded-xl gradient-wind shadow-soft">
          <Calendar className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground capitalize">{dayName}</h2>
          <p className="text-sm text-muted-foreground capitalize">{dateFormatted}</p>
        </div>
      </div>

      {/* Daily Activity Recommendation */}
      {dailyActivity && (
        <DailyActivityBadge 
          activity={dailyActivity.activity} 
          locationName={dailyActivity.locationName} 
        />
      )}

      {/* Locations for this day */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locationsWithForecasts.map(({ location, forecast, isLoading }) => (
          <Card 
            key={location.id} 
            className="gradient-card shadow-card hover:shadow-hover transition-all duration-300 overflow-hidden group"
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">{location.name}</h3>
                    {location.region && (
                      <p className="text-xs text-muted-foreground">{location.region}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveLocation(location.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4 px-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm">Henter...</span>
                </div>
              ) : forecast ? (
                <div className="mt-2 overflow-x-auto -mx-4 px-4">
                  <div className="min-w-[180px]">
                    {/* Header row with hours */}
                    <div className={`grid gap-1 sm:gap-2 mb-2`} style={{ gridTemplateColumns: `auto repeat(${displayHours.length}, 1fr)` }}>
                      <div className="w-12 sm:w-16"></div>
                      {displayHours.map((hour) => (
                        <div key={hour} className="text-center text-xs text-muted-foreground">
                          {hour}:00
                        </div>
                      ))}
                    </div>
                    
                    {/* Wind row */}
                    <div className={`grid gap-1 sm:gap-2 items-center mb-1`} style={{ gridTemplateColumns: `auto repeat(${displayHours.length}, 1fr)` }}>
                      <div className="w-12 sm:w-16 text-xs text-muted-foreground font-medium">Vindkast<br /><span className="font-normal">({unitLabel})</span></div>
                      {displayHours.map((hour) => {
                        const hourForecast = forecast.forecasts.find(f => f.hour === hour);
                        return (
                          <div key={hour} className="flex flex-col items-center gap-0.5">
                            {hourForecast ? (
                              <>
                                <WindSpeedBadge speed={hourForecast.windGust} gust={hourForecast.windGust} size="sm" unit={windUnit} />
                                <span className="text-[10px] text-muted-foreground">{convertWindSpeed(hourForecast.windSpeed, windUnit).toFixed(0)}</span>
                                <WindDirectionIcon 
                                  direction={hourForecast.windDirection} 
                                  className="w-3 h-3 text-muted-foreground"
                                />
                              </>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Sea current row - only show if any hour has data */}
                    {forecast.forecasts.some(f => f.seaCurrentSpeed != null) && (
                      <div className={`grid gap-1 sm:gap-2 items-center`} style={{ gridTemplateColumns: `auto repeat(${displayHours.length}, 1fr)` }}>
                        <div className="w-12 sm:w-16 text-xs text-muted-foreground font-medium">Havstrøm<br /><span className="font-normal">(cm/s)</span></div>
                        {displayHours.map((hour) => {
                          const hourForecast = forecast.forecasts.find(f => f.hour === hour);
                          return (
                            <div key={hour} className="text-center">
                              {hourForecast?.seaCurrentSpeed != null ? (
                                <SeaCurrentBadge 
                                  speed={hourForecast.seaCurrentSpeed} 
                                  direction={hourForecast.seaCurrentDirection}
                                />
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Ingen data
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
import { Calendar, MapPin, Loader2, Thermometer } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WindDirectionIcon } from "./WindDirectionIcon";
import { WindSpeedBadge } from "./WindSpeedBadge";
import { SeaCurrentBadge } from "./SeaCurrentBadge";
import { WaveBadge } from "./WaveBadge";
import { TemperatureBadge } from "./TemperatureBadge";
import { WeatherIcon } from "./WeatherIcon";
import { DailyActivityBadge } from "./DailyActivityBadge";
import { LocationActivityBadges } from "./LocationActivityBadges";
import { X } from "lucide-react";
import type { DayForecast, Location } from "@/types/weather";
import type { ActivityRule, ActivityType } from "@/types/activity";
import { findDailyActivity, findAllMatchingActivities } from "@/lib/activityMatcher";
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

const ALL_DISPLAY_HOURS = [10, 12, 14, 16, 18];

const formatDateHeader = (dateStr: string): { dayName: string; dateFormatted: string; isoDate: string } => {
  try {
    const date = parseISO(dateStr);
    
    return { 
      dayName: format(date, "EEEE", { locale: nb }), 
      dateFormatted: format(date, "d. MMMM", { locale: nb }),
      isoDate: dateStr
    };
  } catch {
    return { dayName: dateStr, dateFormatted: "", isoDate: "" };
  }
};

export const DaySection = ({ date, locationsWithForecasts, onRemoveLocation, activityRules = [] }: DaySectionProps) => {
  const { dayName, dateFormatted, isoDate } = formatDateHeader(date);
  const { windUnit } = useUserSettings();
  const unitLabel = getWindUnitLabel(windUnit);
  
  const displayHours = ALL_DISPLAY_HOURS;

  // Filter activity rules to only include those for locations currently displayed
  const activeLocationIds = useMemo(() => 
    new Set(locationsWithForecasts.map(lf => lf.location.id)),
    [locationsWithForecasts]
  );
  
  const filteredActivityRules = useMemo(() => 
    activityRules.filter(rule => activeLocationIds.has(rule.location_id)),
    [activityRules, activeLocationIds]
  );

  // Find the recommended activity for this day
  const dailyActivity = useMemo(() => {
    if (filteredActivityRules.length === 0) return null;
    return findDailyActivity(filteredActivityRules, locationsWithForecasts);
  }, [filteredActivityRules, locationsWithForecasts]);

  // Calculate matching activities for each location
  const locationActivities = useMemo(() => {
    const map = new Map<string, ActivityType[]>();
    for (const { location, forecast } of locationsWithForecasts) {
      const activities = findAllMatchingActivities(filteredActivityRules, location.id, forecast);
      map.set(location.id, activities);
    }
    return map;
  }, [filteredActivityRules, locationsWithForecasts]);

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
      <div className="flex flex-wrap gap-4">
        {locationsWithForecasts.map(({ location, forecast, isLoading }) => {
          const matchingActivities = locationActivities.get(location.id) || [];

          return (
            <Card 
              key={location.id} 
              className="gradient-card shadow-card hover:shadow-hover transition-all duration-300 overflow-hidden group w-full sm:w-[340px] flex-shrink-0"
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate leading-none">{location.name}</h3>
                      <LocationActivityBadges activities={matchingActivities} />
                    </div>
                    {location.region && (
                      <p className="text-xs text-muted-foreground truncate">{location.region}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveLocation(location.id)}
                  className="transition-opacity h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
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
                <div className="mt-2 overflow-x-auto">
                  <div className="min-w-[280px]">
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
                        // Check if this hour is in the past (for today) and has no wind data
                        const now = new Date();
                        const forecastDate = parseISO(isoDate);
                        const isPastHour = isToday(forecastDate) && hour < now.getHours();
                        const hasNoWindData = hourForecast && hourForecast.windSpeed === 0 && hourForecast.windGust === 0;
                        const showDash = isPastHour && hasNoWindData;
                        
                        return (
                          <div key={hour} className="flex flex-col items-center gap-0.5">
                            {hourForecast ? (
                              showDash ? (
                                <span className="text-muted-foreground text-xs">-</span>
                              ) : (
                                <>
                                  <WindSpeedBadge speed={hourForecast.windGust} gust={hourForecast.windGust} size="sm" unit={windUnit} />
                                  <span className="text-[10px] text-muted-foreground">{convertWindSpeed(hourForecast.windSpeed, windUnit).toFixed(0)}</span>
                                  <WindDirectionIcon 
                                    direction={hourForecast.windDirection} 
                                    className="w-3 h-3 text-muted-foreground"
                                  />
                                </>
                              )
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Wave height row - only show if any hour has data */}
                    {forecast.forecasts.some(f => f.waveHeight != null) && (
                      <div className={`grid gap-1 sm:gap-2 items-center mb-1`} style={{ gridTemplateColumns: `auto repeat(${displayHours.length}, 1fr)` }}>
                        <div className="w-12 sm:w-16 text-xs text-muted-foreground font-medium">Bølger<br /><span className="font-normal">(m)</span></div>
                        {displayHours.map((hour) => {
                          const hourForecast = forecast.forecasts.find(f => f.hour === hour);
                          return (
                            <div key={hour} className="text-center">
                              {hourForecast?.waveHeight != null ? (
                                <WaveBadge 
                                  height={hourForecast.waveHeight} 
                                  direction={hourForecast.waveDirection}
                                />
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Sea current row - only show if any hour has data */}
                    {forecast.forecasts.some(f => f.seaCurrentSpeed != null) && (
                      <div className={`grid gap-1 sm:gap-2 items-center mb-1`} style={{ gridTemplateColumns: `auto repeat(${displayHours.length}, 1fr)` }}>
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

                    {/* Temperature row - only show if any hour has data */}
                    {forecast.forecasts.some(f => f.temperature != null) && (
                      <div className={`grid gap-1 sm:gap-2 items-center mb-1`} style={{ gridTemplateColumns: `auto repeat(${displayHours.length}, 1fr)` }}>
                        <div className="w-12 sm:w-16 text-xs text-muted-foreground font-medium flex items-center gap-1">
                          <Thermometer className="w-3 h-3" />
                          <span>°C</span>
                        </div>
                        {displayHours.map((hour) => {
                          const hourForecast = forecast.forecasts.find(f => f.hour === hour);
                          return (
                            <div key={hour} className="text-center">
                              {hourForecast?.temperature != null ? (
                                <TemperatureBadge temperature={hourForecast.temperature} />
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Weather icon row - at the bottom */}
                    <div className={`grid gap-1 sm:gap-2 items-center`} style={{ gridTemplateColumns: `auto repeat(${displayHours.length}, 1fr)` }}>
                      <div className="w-12 sm:w-16 text-xs text-muted-foreground font-medium">Vær</div>
                      {displayHours.map((hour) => {
                        const hourForecast = forecast.forecasts.find(f => f.hour === hour);
                        return (
                          <div key={hour} className="flex justify-center">
                            {hourForecast?.symbolCode ? (
                              <WeatherIcon symbolCode={hourForecast.symbolCode} size="sm" />
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Ingen data
                </div>
              )}
            </CardContent>
          </Card>
        );
        })}
      </div>
    </section>
  );
};
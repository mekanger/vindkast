import { Calendar, MapPin, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WindDirectionIcon } from "./WindDirectionIcon";
import { WindSpeedBadge } from "./WindSpeedBadge";
import { GustBadge } from "./GustBadge";
import { SeaCurrentBadge } from "./SeaCurrentBadge";
import { X } from "lucide-react";
import type { LocationWeather, DayForecast, Location } from "@/types/weather";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";

interface DaySectionProps {
  date: string;
  locationsWithForecasts: {
    location: Location;
    forecast: DayForecast | undefined;
    isLoading: boolean;
  }[];
  onRemoveLocation: (id: string) => void;
}

const DISPLAY_HOURS = [10, 12, 14, 16];

const formatDateHeader = (dateStr: string): { dayName: string; dateFormatted: string } => {
  try {
    const date = parseISO(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) {
      return { dayName: "I dag", dateFormatted: format(date, "d. MMMM", { locale: nb }) };
    } else if (isTomorrow) {
      return { dayName: "I morgen", dateFormatted: format(date, "d. MMMM", { locale: nb }) };
    } else {
      return { 
        dayName: format(date, "EEEE", { locale: nb }), 
        dateFormatted: format(date, "d. MMMM", { locale: nb }) 
      };
    }
  } catch {
    return { dayName: dateStr, dateFormatted: "" };
  }
};

export const DaySection = ({ date, locationsWithForecasts, onRemoveLocation }: DaySectionProps) => {
  const { dayName, dateFormatted } = formatDateHeader(date);

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
                <div className="mt-2">
                  {/* Header row with hours */}
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    <div className="text-xs text-muted-foreground font-medium"></div>
                    {DISPLAY_HOURS.map((hour) => (
                      <div key={hour} className="text-center text-xs text-muted-foreground">
                        {hour}:00
                      </div>
                    ))}
                  </div>
                  
                  {/* Wind row */}
                  <div className="grid grid-cols-5 gap-2 items-center mb-1">
                    <div className="text-xs text-muted-foreground font-medium whitespace-nowrap">Vind <span className="font-normal">(m/s)</span></div>
                    {DISPLAY_HOURS.map((hour) => {
                      const hourForecast = forecast.forecasts.find(f => f.hour === hour);
                      return (
                        <div key={hour} className="flex flex-col items-center gap-0.5">
                          {hourForecast ? (
                            <>
                              <WindSpeedBadge speed={hourForecast.windSpeed} size="sm" />
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
                  
                  {/* Gust row */}
                  <div className="grid grid-cols-5 gap-2 items-center mb-1">
                    <div className="text-xs text-muted-foreground font-medium whitespace-nowrap">Vindkast <span className="font-normal">(m/s)</span></div>
                    {DISPLAY_HOURS.map((hour) => {
                      const hourForecast = forecast.forecasts.find(f => f.hour === hour);
                      return (
                        <div key={hour} className="text-center">
                          {hourForecast ? (
                            <GustBadge gust={hourForecast.windGust} />
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Sea current row - only show if any hour has data */}
                  {forecast.forecasts.some(f => f.seaCurrentSpeed != null) && (
                    <div className="grid grid-cols-5 gap-2 items-center">
                      <div className="text-xs text-muted-foreground font-medium whitespace-nowrap">Havstrøm <span className="font-normal">(cm/s)</span></div>
                      {DISPLAY_HOURS.map((hour) => {
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
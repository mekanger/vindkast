import { X, Wind, MapPin, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WindDirectionIcon } from "./WindDirectionIcon";
import { WindSpeedBadge } from "./WindSpeedBadge";
import type { LocationWeather } from "@/types/weather";

interface LocationCardProps {
  data: LocationWeather;
  onRemove: (id: string) => void;
  isLoading?: boolean;
}

const DISPLAY_HOURS = [10, 12, 14, 16];

export const LocationCard = ({ data, onRemove, isLoading }: LocationCardProps) => {
  const { location, days } = data;

  return (
    <Card className="gradient-card shadow-card hover:shadow-hover transition-all duration-300 overflow-hidden group">
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{location.name}</h3>
              {location.region && (
                <p className="text-sm text-muted-foreground">{location.region}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(location.id)}
            className="transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>Henter værdata...</span>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-sm font-medium text-muted-foreground">
                    <Wind className="w-4 h-4 inline mr-2" />
                    Dag
                  </th>
                  {DISPLAY_HOURS.map((hour) => (
                    <th key={hour} className="text-center py-2 px-2 text-sm font-medium text-muted-foreground">
                      {hour}:00
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day.date} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-foreground text-sm">{day.date}</div>
                    </td>
                    {DISPLAY_HOURS.map((hour) => {
                      const forecast = day.forecasts.find(f => f.hour === hour);
                      return (
                        <td key={hour} className="py-3 px-2 text-center">
                          {forecast ? (
                            <div className="flex flex-col items-center gap-1">
                              <WindSpeedBadge speed={forecast.windSpeed} gust={forecast.windGust} />
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <WindDirectionIcon 
                                  direction={forecast.windDirection} 
                                  className="w-3 h-3"
                                />
                                <span>{forecast.windDirection}°</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

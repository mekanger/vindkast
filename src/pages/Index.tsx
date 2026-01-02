import { useState, useCallback } from "react";
import { Wind } from "lucide-react";
import { LocationSearch } from "@/components/LocationSearch";
import { LocationCard } from "@/components/LocationCard";
import { EmptyState } from "@/components/EmptyState";
import { fetchWeatherForecast } from "@/lib/yrApi";
import { useToast } from "@/hooks/use-toast";
import type { Location, LocationWeather } from "@/types/weather";

const Index = () => {
  const [locations, setLocations] = useState<LocationWeather[]>([]);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleLocationSelect = useCallback(async (location: Location) => {
    // Add location immediately with empty days (shows loading state)
    const placeholderData: LocationWeather = {
      location,
      days: [],
    };
    
    setLocations(prev => [...prev, placeholderData]);
    setLoadingIds(prev => new Set(prev).add(location.id));

    try {
      const weatherData = await fetchWeatherForecast(location);
      setLocations(prev => 
        prev.map(loc => loc.location.id === location.id ? weatherData : loc)
      );
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast({
        title: "Kunne ikke hente værdata",
        description: `Feil ved henting av værmelding for ${location.name}`,
        variant: "destructive",
      });
      // Remove the location on error
      setLocations(prev => prev.filter(loc => loc.location.id !== location.id));
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(location.id);
        return next;
      });
    }
  }, [toast]);

  const handleRemoveLocation = useCallback((id: string) => {
    setLocations(prev => prev.filter(loc => loc.location.id !== id));
  }, []);

  const existingLocationIds = locations.map(loc => loc.location.id);

  return (
    <div className="min-h-screen gradient-sky">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl gradient-wind shadow-soft">
                <Wind className="w-6 h-6 text-primary-foreground animate-wind" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">VindVarsel</h1>
                <p className="text-sm text-muted-foreground">Vindmelding fra yr.no</p>
              </div>
            </div>
            <LocationSearch 
              onLocationSelect={handleLocationSelect}
              existingLocationIds={existingLocationIds}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {locations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {locations.map((data) => (
              <LocationCard
                key={data.location.id}
                data={data}
                onRemove={handleRemoveLocation}
                isLoading={loadingIds.has(data.location.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Værdata fra yr.no, levert av Meteorologisk institutt og NRK</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

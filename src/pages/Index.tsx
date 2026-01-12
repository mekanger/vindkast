import { useState, useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Wind, LogIn } from "lucide-react";
import { LocationSearch } from "@/components/LocationSearch";
import { DaySection } from "@/components/DaySection";
import { EmptyState } from "@/components/EmptyState";
import { UserMenu } from "@/components/UserMenu";
import { ActivityRulesManager } from "@/components/ActivityRulesManager";
import { Button } from "@/components/ui/button";
import { fetchWeatherForecast } from "@/lib/yrApi";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSavedLocations } from "@/hooks/useSavedLocations";
import { useActivityRules } from "@/hooks/useActivityRules";
import type { Location, LocationWeather } from "@/types/weather";

const Index = () => {
  const [locations, setLocations] = useState<LocationWeather[]>([]);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { savedLocations, loading: locationsLoading, saveLocation, removeLocation } = useSavedLocations();
  const { rules: activityRules, refetch: refetchRules } = useActivityRules();

  // Load saved locations on mount
  useEffect(() => {
    if (authLoading || locationsLoading || initialLoadDone) return;
    if (savedLocations.length === 0) {
      setInitialLoadDone(true);
      return;
    }

    const loadSavedLocations = async () => {
      // Filter out locations that are already loaded
      const locationsToLoad = savedLocations.filter(
        loc => !locations.some(l => l.location.id === loc.id)
      );

      if (locationsToLoad.length === 0) {
        setInitialLoadDone(true);
        return;
      }

      for (const location of locationsToLoad) {
        const placeholderData: LocationWeather = {
          location,
          days: [],
        };
        
        setLocations(prev => {
          // Double-check to prevent race conditions
          if (prev.some(l => l.location.id === location.id)) return prev;
          return [...prev, placeholderData];
        });
        setLoadingIds(prev => new Set(prev).add(location.id));

        try {
          const weatherData = await fetchWeatherForecast(location);
          setLocations(prev => 
            prev.map(loc => loc.location.id === location.id ? weatherData : loc)
          );
        } catch (error) {
          console.error('Error fetching weather:', error);
          setLocations(prev => prev.filter(loc => loc.location.id !== location.id));
        } finally {
          setLoadingIds(prev => {
            const next = new Set(prev);
            next.delete(location.id);
            return next;
          });
        }
      }
      setInitialLoadDone(true);
    };

    loadSavedLocations();
  }, [authLoading, locationsLoading, savedLocations, initialLoadDone]);

  // Reset initialLoadDone when user changes to reload saved locations
  useEffect(() => {
    setInitialLoadDone(false);
  }, [user]);

  const handleLocationSelect = useCallback(async (location: Location) => {
    // Check if location already exists
    if (locations.some(loc => loc.location.id === location.id)) {
      toast({
        title: "Sted allerede lagt til",
        description: `${location.name} er allerede i dashbordet.`,
        variant: "destructive",
      });
      return;
    }

    // Add location immediately with empty days (shows loading state)
    const placeholderData: LocationWeather = {
      location,
      days: [],
    };
    
    setLocations(prev => [...prev, placeholderData]);
    setLoadingIds(prev => new Set(prev).add(location.id));

    // Save to database if logged in
    if (user) {
      const { error } = await saveLocation(location);
      if (error) {
        console.error('Error saving location:', error);
      }
    }

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
      // Also remove from database
      if (user) {
        await removeLocation(location.id);
      }
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(location.id);
        return next;
      });
    }
  }, [locations, toast, user, saveLocation, removeLocation]);

  const handleRemoveLocation = useCallback(async (id: string) => {
    setLocations(prev => prev.filter(loc => loc.location.id !== id));
    
    // Remove from database if logged in
    if (user) {
      const { error } = await removeLocation(id);
      if (error) {
        console.error('Error removing location:', error);
      }
    }
  }, [user, removeLocation]);

  // Generate dates for next 3 days (based on current local date)
  const dayDates = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Use local date formatting (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    return dates;
  }, []);

  // Prepare data for each day section
  const daySections = useMemo(() => {
    return dayDates.map(date => ({
      date,
      locationsWithForecasts: locations.map(loc => ({
        location: loc.location,
        forecast: loc.days.find(d => d.date === date),
        isLoading: loadingIds.has(loc.location.id),
      })),
    }));
  }, [dayDates, locations, loadingIds]);

  const existingLocationIds = locations.map(loc => loc.location.id);
  const availableLocations = locations.map(loc => loc.location);

  return (
    <div className="min-h-screen gradient-sky">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl gradient-wind shadow-soft">
                  <Wind className="w-6 h-6 text-primary-foreground animate-wind" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">VindVarsel</h1>
                  <p className="text-sm text-muted-foreground">Vindmelding fra yr.no</p>
                </div>
              </div>
              <div className="md:hidden">
                {user ? (
                  <UserMenu />
                ) : (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/auth">
                      <LogIn className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <LocationSearch 
                onLocationSelect={handleLocationSelect}
                existingLocationIds={existingLocationIds}
              />
              {user && (
                <ActivityRulesManager locations={availableLocations} onRulesChange={refetchRules} />
              )}
              <div className="hidden md:block">
                {user ? (
                  <UserMenu />
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/auth">
                      <LogIn className="w-4 h-4 mr-2" />
                      Logg inn
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {locations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            {daySections.map((section) => (
              <DaySection
                key={section.date}
                date={section.date}
                locationsWithForecasts={section.locationsWithForecasts}
                onRemoveLocation={handleRemoveLocation}
                activityRules={activityRules}
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

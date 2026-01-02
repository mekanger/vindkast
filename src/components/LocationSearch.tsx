import { useState, useCallback } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { searchLocations, type YrLocation } from "@/lib/yrApi";
import type { Location } from "@/types/weather";

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
  existingLocationIds: string[];
}

export const LocationSearch = ({ onLocationSelect, existingLocationIds }: LocationSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YrLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setShowResults(true);
    
    try {
      const locations = await searchLocations(query);
      setResults(locations);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Søkefeil",
        description: "Kunne ikke søke etter steder. Prøv igjen.",
        variant: "destructive",
      });
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, toast]);

  const handleSelect = (yrLocation: YrLocation) => {
    if (existingLocationIds.includes(yrLocation.id)) {
      toast({
        title: "Sted allerede lagt til",
        description: `${yrLocation.name} er allerede i dashbordet ditt.`,
        variant: "destructive",
      });
      return;
    }

    // Convert YrLocation to Location
    const location: Location = {
      id: yrLocation.id,
      name: yrLocation.name,
      region: yrLocation.region,
      country: yrLocation.country,
      coordinates: {
        lat: yrLocation.coordinates.lat,
        lon: yrLocation.coordinates.lon,
      },
    };
    
    onLocationSelect(location);
    setQuery("");
    setResults([]);
    setShowResults(false);
    
    toast({
      title: "Sted lagt til",
      description: `${location.name} er nå lagt til i dashbordet.`,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Søk etter sted..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="pl-10 h-12 text-base bg-card shadow-soft border-border/50 focus:shadow-card transition-shadow"
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={isSearching || !query.trim()}
          className="h-12 px-6 gradient-wind text-primary-foreground shadow-soft hover:shadow-card transition-all"
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Søk"
          )}
        </Button>
      </div>
      
      {showResults && (results.length > 0 || isSearching) && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-card overflow-hidden">
          {isSearching ? (
            <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Søker...</span>
            </div>
          ) : (
            <ul className="py-2">
              {results.map((location) => {
                const isAdded = existingLocationIds.includes(location.id);
                return (
                  <li key={location.id}>
                    <button
                      onClick={() => handleSelect(location)}
                      disabled={isAdded}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MapPin className="w-5 h-5 text-primary shrink-0" />
                      <div className="text-left">
                        <div className="font-medium text-foreground">
                          {location.name}
                          {isAdded && (
                            <span className="ml-2 text-xs text-muted-foreground">(lagt til)</span>
                          )}
                        </div>
                        {location.region && (
                          <div className="text-sm text-muted-foreground">
                            {location.region}, {location.country}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
      
      {showResults && !isSearching && results.length === 0 && query.trim() && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-card">
          <div className="p-4 text-center text-muted-foreground">
            Ingen steder funnet for "{query}"
          </div>
        </Card>
      )}
    </div>
  );
};

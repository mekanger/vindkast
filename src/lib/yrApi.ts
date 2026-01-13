import { supabase } from "@/integrations/supabase/client";
import type { Location, LocationWeather, DayForecast, WindForecast } from "@/types/weather";

export interface YrLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export async function searchLocations(query: string): Promise<YrLocation[]> {
  if (!query || query.length < 2) {
    return [];
  }

  if (query.length > 200) {
    throw new Error('Søketeksten er for lang');
  }

  const { data, error } = await supabase.functions.invoke('yr-location-search', {
    body: { query },
  });

  if (error) {
    console.error('Error searching locations:', error);
    throw new Error('Kunne ikke søke etter steder');
  }

  return data?.locations || [];
}

export async function fetchWeatherForecast(location: Location): Promise<LocationWeather> {
  // Validate coordinates client-side
  const lat = location.coordinates.lat;
  const lon = location.coordinates.lon;
  
  if (typeof lat !== 'number' || typeof lon !== 'number' ||
      lat < -90 || lat > 90 || lon < -180 || lon > 180 ||
      !Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('Ugyldige koordinater');
  }

  const { data, error } = await supabase.functions.invoke('yr-weather-forecast', {
    body: { lat, lon },
  });

  if (error) {
    console.error('Error fetching weather:', error);
    throw new Error('Kunne ikke hente værmelding');
  }

  // Transform API response to our format
  const days: DayForecast[] = (data?.days || []).map((day: any) => {
    const forecasts: WindForecast[] = day.forecasts.map((fc: any) => ({
      hour: fc.hour,
      windSpeed: Math.round(fc.windSpeed * 10) / 10,
      windGust: Math.round(fc.windGust * 10) / 10,
      windDirection: Math.round(fc.windDirection),
      temperature: fc.temperature != null ? Math.round(fc.temperature * 10) / 10 : undefined,
      seaCurrentSpeed: fc.seaCurrentSpeed != null ? Math.round(fc.seaCurrentSpeed * 100) : undefined, // m/s to cm/s
      seaCurrentDirection: fc.seaCurrentDirection != null ? Math.round(fc.seaCurrentDirection) : undefined,
      waveHeight: fc.waveHeight != null ? Math.round(fc.waveHeight * 10) / 10 : undefined,
      waveDirection: fc.waveDirection != null ? Math.round(fc.waveDirection) : undefined,
    }));

    return {
      date: day.date, // Keep as ISO format (YYYY-MM-DD) for matching
      forecasts,
    };
  });

  return {
    location,
    days,
  };
}

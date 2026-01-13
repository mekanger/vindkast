import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CACHE_TTL_MINUTES = 60; // 1 hour cache

// Allowed origins for CORS
const allowedOrigins = [
  Deno.env.get('SUPABASE_URL') || '',
  'https://lovable.dev',
  'https://gptengineer.app', 
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const isAllowed = allowedOrigins.some(allowed => 
    origin === allowed || 
    origin.endsWith('.lovable.app') || 
    origin.endsWith('.lovableproject.com') ||
    origin.endsWith('.gptengineer.run')
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon } = await req.json();

    // Comprehensive input validation
    if (lat === undefined || lon === undefined) {
      console.log('Missing coordinates');
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      console.log('Invalid coordinate types:', typeof lat, typeof lon);
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude must be numbers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      console.log('Coordinates out of range:', lat, lon);
      return new Response(
        JSON.stringify({ error: 'Invalid coordinates: latitude must be -90 to 90, longitude -180 to 180' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      console.log('Non-finite coordinates:', lat, lon);
      return new Response(
        JSON.stringify({ error: 'Coordinates must be finite numbers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Round coordinates to 2 decimal places for cache key (about 1km precision)
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;
    const cacheKey = `weather_v7_${roundedLat}_${roundedLon}`; // v7 adds tidal data

    // Initialize Supabase client with service role for cache operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('weather_cache')
      .select('response_data, expires_at')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (!cacheError && cachedData && new Date(cachedData.expires_at) > new Date()) {
      console.log('Cache hit for:', cacheKey);
      return new Response(
        JSON.stringify(cachedData.response_data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
      );
    }

    console.log('Cache miss for:', cacheKey, '- fetching from yr.no');

    const userAgent = 'WindDashboard/1.0 github.com/lovable-wind-dashboard';

    // Fetch weather forecast from locationforecast API
    const forecastUrl = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat}&lon=${lon}`;
    
    const forecastResponse = await fetch(forecastUrl, {
      headers: { 'User-Agent': userAgent },
    });

    if (!forecastResponse.ok) {
      console.error('Met.no forecast API error:', forecastResponse.status, forecastResponse.statusText);
      throw new Error(`Met.no API error: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();
    const timeseries = forecastData.properties?.timeseries || [];

    // Fetch ocean forecast (might fail for inland locations - that's OK)
    let oceanTimeseries: any[] = [];
    try {
      const oceanUrl = `https://api.met.no/weatherapi/oceanforecast/2.0/complete?lat=${lat}&lon=${lon}`;
      const oceanResponse = await fetch(oceanUrl, {
        headers: { 'User-Agent': userAgent },
      });
      
      if (oceanResponse.ok) {
        const oceanData = await oceanResponse.json();
        oceanTimeseries = oceanData.properties?.timeseries || [];
        console.log('Ocean forecast fetched successfully, entries:', oceanTimeseries.length);
      } else {
        console.log('Ocean forecast not available for this location (status:', oceanResponse.status, ')');
      }
    } catch (oceanError) {
      console.log('Ocean forecast fetch failed (location likely inland):', oceanError);
    }

    // Fetch tidal data (might fail for locations without tide data)
    let tidalData: any[] = [];
    try {
      const tidalUrl = `https://api.met.no/weatherapi/tidalwater/1.1?lat=${lat}&lon=${lon}`;
      const tidalResponse = await fetch(tidalUrl, {
        headers: { 'User-Agent': userAgent },
      });
      
      if (tidalResponse.ok) {
        const tidalJson = await tidalResponse.json();
        tidalData = tidalJson.locationdata?.data || [];
        console.log('Tidal data fetched successfully, entries:', tidalData.length);
      } else {
        console.log('Tidal data not available for this location (status:', tidalResponse.status, ')');
      }
    } catch (tidalError) {
      console.log('Tidal fetch failed:', tidalError);
    }

    // Get target hours: 10, 12, 14, 16, 18, 20
    const targetHours = [10, 12, 14, 16, 18, 20];
    
    // Get the next 3 days
    const now = new Date();
    const days: { date: string; forecasts: any[] }[] = [];

    for (let d = 0; d < 3; d++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + d);
      const dateStr = targetDate.toISOString().split('T')[0];

      const dayForecasts: any[] = [];

      for (const hour of targetHours) {
        // Use local Norwegian time (UTC+1) for matching
        // yr.no provides forecasts in UTC, but we want to match Norwegian local hours
        const utcHour = hour - 1; // Norway is UTC+1 in winter
        const targetTime = `${dateStr}T${utcHour.toString().padStart(2, '0')}:00:00Z`;
        
        let entry = timeseries.find((ts: any) => ts.time === targetTime);
        
        if (!entry) {
          // Find nearest entry within a 2-hour window
          entry = timeseries.find((ts: any) => {
            const tsDate = new Date(ts.time);
            return tsDate.toISOString().split('T')[0] === dateStr && 
                   Math.abs(tsDate.getUTCHours() - utcHour) <= 1;
          });
        }
        
        // If still no entry (hour has passed), mark as past
        const isPastHour = !entry && d === 0;

        // Find ocean data for this time
        let oceanEntry = oceanTimeseries.find((ts: any) => ts.time === targetTime);
        if (!oceanEntry) {
          oceanEntry = oceanTimeseries.find((ts: any) => {
            const tsDate = new Date(ts.time);
            return tsDate.toISOString().split('T')[0] === dateStr && 
                   Math.abs(tsDate.getUTCHours() - utcHour) <= 1;
          });
        }

        // Find tidal data for this time
        // Tidal API uses format: "2024-01-15T10:00:00+01:00"
        let tidalEntry = null;
        const localTimeStr = `${dateStr}T${hour.toString().padStart(2, '0')}:00:00+01:00`;
        tidalEntry = tidalData.find((td: any) => td.time === localTimeStr);
        if (!tidalEntry) {
          // Try to find nearest within 1 hour
          tidalEntry = tidalData.find((td: any) => {
            try {
              const tdDate = new Date(td.time);
              const targetDate = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00+01:00`);
              return Math.abs(tdDate.getTime() - targetDate.getTime()) <= 3600000; // 1 hour in ms
            } catch {
              return false;
            }
          });
        }

        const instant = entry?.data?.instant?.details;
        const oceanInstant = oceanEntry?.data?.instant?.details;
        
        // Get weather symbol from next_1_hours (or next_6_hours as fallback)
        const symbolCode = entry?.data?.next_1_hours?.summary?.symbol_code 
          || entry?.data?.next_6_hours?.summary?.symbol_code 
          || null;

        // Parse tidal value (in cm relative to chart datum)
        const tidalValue = tidalEntry?.value ? parseFloat(tidalEntry.value) : null;
        
        dayForecasts.push({
          hour,
          windSpeed: instant?.wind_speed ?? (isPastHour ? null : 0),
          windGust: instant?.wind_speed_of_gust ?? instant?.wind_speed ?? (isPastHour ? null : 0),
          windDirection: instant?.wind_from_direction ?? (isPastHour ? null : 0),
          temperature: instant?.air_temperature ?? null,
          symbolCode,
          isPast: isPastHour,
          // Ocean current data (sea_water_speed is in m/s, we convert to cm/s in client)
          seaCurrentSpeed: oceanInstant?.sea_water_speed ?? null,
          seaCurrentDirection: oceanInstant?.sea_water_to_direction ?? null,
          // Wave data
          waveHeight: oceanInstant?.sea_surface_wave_height ?? null,
          waveDirection: oceanInstant?.sea_surface_wave_from_direction ?? null,
          // Tidal data (cm relative to chart datum)
          tidalHeight: tidalValue,
        });
      }

      days.push({
        date: dateStr,
        forecasts: dayForecasts,
      });
    }

    const result = { days };

    // Store in cache
    const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString();
    
    const { error: upsertError } = await supabase
      .from('weather_cache')
      .upsert({
        cache_key: cacheKey,
        response_data: result,
        cached_at: new Date().toISOString(),
        expires_at: expiresAt,
      }, { onConflict: 'cache_key' });

    if (upsertError) {
      console.error('Error caching weather data:', upsertError);
    } else {
      console.log('Cached weather data for:', cacheKey, 'expires:', expiresAt);
    }

    console.log('Processed forecast for', days.length, 'days');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in yr-weather-forecast:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
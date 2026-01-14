import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CACHE_TTL_MINUTES = 60; // 1 hour cache

// Available harbors for tidal data with their coordinates
const TIDAL_HARBORS: { name: string; lat: number; lon: number }[] = [
  { name: 'andenes', lat: 69.3267, lon: 16.1192 },
  { name: 'bergen', lat: 60.3913, lon: 5.3221 },
  { name: 'bodø', lat: 67.2804, lon: 14.4049 },
  { name: 'bruravik', lat: 60.3617, lon: 6.8067 },
  { name: 'hammerfest', lat: 70.6634, lon: 23.6821 },
  { name: 'harstad', lat: 68.7983, lon: 16.5417 },
  { name: 'heimsjø', lat: 63.4267, lon: 9.1017 },
  { name: 'helgeroa', lat: 58.9900, lon: 9.8567 },
  { name: 'honningsvåg', lat: 70.9827, lon: 25.9706 },
  { name: 'kabelvåg', lat: 68.2117, lon: 14.4800 },
  { name: 'kristiansund', lat: 63.1108, lon: 7.7278 },
  { name: 'leirvik', lat: 59.7783, lon: 5.5083 },
  { name: 'mausund', lat: 63.8700, lon: 8.6650 },
  { name: 'måløy', lat: 61.9333, lon: 5.1167 },
  { name: 'narvik', lat: 68.4385, lon: 17.4273 },
  { name: 'ny-ålesund', lat: 78.9233, lon: 11.9267 },
  { name: 'oscarsborg', lat: 59.6783, lon: 10.6050 },
  { name: 'oslo', lat: 59.9139, lon: 10.7522 },
  { name: 'rørvik', lat: 64.8617, lon: 11.2383 },
  { name: 'sandnes', lat: 58.8517, lon: 5.7350 },
  { name: 'sirevåg', lat: 58.4883, lon: 5.9217 },
  { name: 'solumstrand', lat: 59.7417, lon: 10.2217 },
  { name: 'stavanger', lat: 58.9700, lon: 5.7331 },
  { name: 'tregde', lat: 58.0083, lon: 7.5450 },
  { name: 'tromsø', lat: 69.6492, lon: 18.9560 },
  { name: 'trondheim', lat: 63.4305, lon: 10.3951 },
  { name: 'træna', lat: 66.4950, lon: 12.0917 },
  { name: 'vardø', lat: 70.3706, lon: 31.1089 },
  { name: 'viker', lat: 59.0367, lon: 10.9500 },
  { name: 'ålesund', lat: 62.4722, lon: 6.1495 },
];

// Find nearest harbor within max distance (km)
function findNearestHarbor(lat: number, lon: number, maxDistanceKm: number = 50): string | null {
  const toRad = (deg: number) => deg * Math.PI / 180;
  
  let nearestHarbor: string | null = null;
  let minDistance = Infinity;
  
  for (const harbor of TIDAL_HARBORS) {
    // Haversine formula for distance
    const R = 6371; // Earth's radius in km
    const dLat = toRad(harbor.lat - lat);
    const dLon = toRad(harbor.lon - lon);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat)) * Math.cos(toRad(harbor.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < minDistance && distance <= maxDistanceKm) {
      minDistance = distance;
      nearestHarbor = harbor.name;
    }
  }
  
  return nearestHarbor;
}

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
    const cacheKey = `weather_v10_${roundedLat}_${roundedLon}`; // v10 adds tidal extremes

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

    // Fetch tidal data using nearest harbor
    // Tidal API uses plaintext format with specific harbors, not lat/lon
    let tidalData: { year: number; month: number; day: number; hour: number; minute: number; total: number }[] = [];
    const nearestHarbor = findNearestHarbor(lat, lon);
    
    if (nearestHarbor) {
      try {
        const tidalUrl = `https://api.met.no/weatherapi/tidalwater/1.1/?harbor=${nearestHarbor}`;
        const tidalResponse = await fetch(tidalUrl, {
          headers: { 'User-Agent': userAgent },
        });
        
        if (tidalResponse.ok) {
          const tidalText = await tidalResponse.text();
          // Parse the plaintext response
          // Format: AAR MND DAG TIM MIN  SURGE  TIDE   TOTAL  0p     25p    50p    75p    100p
          const lines = tidalText.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            // Skip header lines and empty lines
            if (!trimmed || trimmed.startsWith('MET') || trimmed.startsWith('VANN') || 
                trimmed.startsWith('SIST') || trimmed.startsWith('===') || 
                trimmed.startsWith('---') || trimmed.startsWith('AAR') ||
                trimmed.includes('PROGNOSER') || trimmed.includes('STORMFLO') ||
                /^[A-ZÆØÅ]+$/.test(trimmed)) {
              continue;
            }
            
            // Parse data line: 2024  10  24  12   0   0.09   0.17   0.26   0.04   0.09   0.09   0.09   0.14
            const parts = trimmed.split(/\s+/).filter(p => p.length > 0);
            if (parts.length >= 8) {
              const year = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10);
              const day = parseInt(parts[2], 10);
              const hour = parseInt(parts[3], 10);
              const minute = parseInt(parts[4], 10);
              const total = parseFloat(parts[7]); // TOTAL column (meters above mean sea level)
              
              if (!isNaN(year) && !isNaN(month) && !isNaN(day) && !isNaN(hour) && !isNaN(total)) {
                tidalData.push({ year, month, day, hour, minute, total });
              }
            }
          }
          console.log('Tidal data fetched from', nearestHarbor, '- entries:', tidalData.length);
        } else {
          console.log('Tidal data not available for harbor', nearestHarbor, '(status:', tidalResponse.status, ')');
        }
      } catch (tidalError) {
        console.log('Tidal fetch failed:', tidalError);
      }
    } else {
      console.log('No tidal harbor within 50km of location');
    }

    // Fetch sunrise/sunset data for all 3 days
    const sunData: Map<string, { sunrise: string; sunset: string }> = new Map();
    try {
      const now = new Date();
      // Build date range for sunrise API
      const startDate = now.toISOString().split('T')[0];
      const endDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const sunUrl = `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${lat}&lon=${lon}&date=${startDate}&offset=+01:00`;
      const sunResponse = await fetch(sunUrl, {
        headers: { 'User-Agent': userAgent },
      });
      
      if (sunResponse.ok) {
        const sunJson = await sunResponse.json();
        // API returns data for requested date
        if (sunJson.properties?.sunrise?.time && sunJson.properties?.sunset?.time) {
          sunData.set(startDate, {
            sunrise: sunJson.properties.sunrise.time,
            sunset: sunJson.properties.sunset.time,
          });
        }
        console.log('Sun data fetched for', startDate);
      }
      
      // Fetch for next 2 days
      for (let d = 1; d <= 2; d++) {
        const dateObj = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
        const dateStr = dateObj.toISOString().split('T')[0];
        const dayUrl = `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${lat}&lon=${lon}&date=${dateStr}&offset=+01:00`;
        const dayResponse = await fetch(dayUrl, {
          headers: { 'User-Agent': userAgent },
        });
        
        if (dayResponse.ok) {
          const dayJson = await dayResponse.json();
          if (dayJson.properties?.sunrise?.time && dayJson.properties?.sunset?.time) {
            sunData.set(dateStr, {
              sunrise: dayJson.properties.sunrise.time,
              sunset: dayJson.properties.sunset.time,
            });
          }
        }
      }
      console.log('Sun data entries:', sunData.size);
    } catch (sunError) {
      console.log('Sunrise/sunset fetch failed:', sunError);
    }

    // Get target hours: 10, 12, 14, 16, 18, 20
    const targetHours = [10, 12, 14, 16, 18, 20];
    
    // Get the next 3 days
    const now = new Date();
    const days: { date: string; forecasts: any[]; sunrise?: string; sunset?: string; tidalExtremes?: { time: string; type: 'high' | 'low'; height: number }[] }[] = [];

    // Helper function to find tidal extremes (high/low tide) for a specific date between 08:00 and 20:00
    const findTidalExtremes = (targetYear: number, targetMonth: number, targetDay: number) => {
      const dayTidalData = tidalData.filter(td => 
        td.year === targetYear && 
        td.month === targetMonth && 
        td.day === targetDay &&
        td.hour >= 8 && td.hour < 20 // Only 08:00 to 20:00
      ).sort((a, b) => {
        // Sort by time
        if (a.hour !== b.hour) return a.hour - b.hour;
        return a.minute - b.minute;
      });

      if (dayTidalData.length < 5) return []; // Need sufficient data points

      // Find significant extremes using a larger window and minimum height difference
      const extremes: { time: string; type: 'high' | 'low'; height: number; minutes: number }[] = [];
      const MIN_HEIGHT_DIFF = 0.05; // Minimum 5cm difference to be considered significant
      const MIN_TIME_GAP_MINUTES = 180; // At least 3 hours between extremes (tidal cycle is ~6 hours)

      // Use a sliding window approach - look at a wider neighborhood
      const windowSize = 6; // Look at 6 points on each side (typically ~1 hour of data)
      
      for (let i = windowSize; i < dayTidalData.length - windowSize; i++) {
        const curr = dayTidalData[i];
        const currMinutes = curr.hour * 60 + curr.minute;
        
        // Get values in the window
        let isLocalMax = true;
        let isLocalMin = true;
        let maxDiff = 0;
        
        for (let j = i - windowSize; j <= i + windowSize; j++) {
          if (j === i) continue;
          const other = dayTidalData[j];
          const diff = Math.abs(curr.total - other.total);
          maxDiff = Math.max(maxDiff, diff);
          
          if (other.total >= curr.total) isLocalMax = false;
          if (other.total <= curr.total) isLocalMin = false;
        }
        
        // Only add if it's a significant extreme with enough height difference
        if ((isLocalMax || isLocalMin) && maxDiff >= MIN_HEIGHT_DIFF) {
          // Check time gap from last extreme
          const lastExtreme = extremes[extremes.length - 1];
          if (lastExtreme) {
            const timeGap = currMinutes - lastExtreme.minutes;
            if (timeGap < MIN_TIME_GAP_MINUTES) {
              // If this extreme is more significant (greater height diff), replace the last one
              if (maxDiff > Math.abs(lastExtreme.height / 100)) {
                extremes.pop();
              } else {
                continue; // Skip this one, keep the previous
              }
            }
          }
          
          extremes.push({
            time: `${curr.hour.toString().padStart(2, '0')}:${curr.minute.toString().padStart(2, '0')}`,
            type: isLocalMax ? 'high' : 'low',
            height: Math.round(curr.total * 100), // Convert to cm
            minutes: currMinutes,
          });
        }
      }

      // Remove the minutes field before returning
      return extremes.map(({ time, type, height }) => ({ time, type, height }));
    };

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
        // Tidal data is parsed from plaintext with year, month, day, hour, minute, total
        const dateParts = dateStr.split('-');
        const targetYear = parseInt(dateParts[0], 10);
        const targetMonth = parseInt(dateParts[1], 10);
        const targetDay = parseInt(dateParts[2], 10);
        
        // Find tidal entry matching hour (ignore minutes, find nearest hour)
        let tidalEntry = tidalData.find(td => 
          td.year === targetYear && 
          td.month === targetMonth && 
          td.day === targetDay && 
          td.hour === hour && 
          td.minute === 0
        );
        
        if (!tidalEntry) {
          // Try to find nearest within the hour
          tidalEntry = tidalData.find(td => 
            td.year === targetYear && 
            td.month === targetMonth && 
            td.day === targetDay && 
            td.hour === hour
          );
        }

        const instant = entry?.data?.instant?.details;
        const oceanInstant = oceanEntry?.data?.instant?.details;
        
        // Get weather symbol from next_1_hours (or next_6_hours as fallback)
        const symbolCode = entry?.data?.next_1_hours?.summary?.symbol_code 
          || entry?.data?.next_6_hours?.summary?.symbol_code 
          || null;

        // Parse tidal value (in meters, convert to cm for display)
        const tidalValue = tidalEntry ? Math.round(tidalEntry.total * 100) : null;
        
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

      // Get sunrise/sunset for this day
      const daySun = sunData.get(dateStr);
      
      // Find tidal extremes for this day
      const tidalExtremes = findTidalExtremes(
        parseInt(dateStr.split('-')[0], 10),
        parseInt(dateStr.split('-')[1], 10),
        parseInt(dateStr.split('-')[2], 10)
      );
      
      days.push({
        date: dateStr,
        forecasts: dayForecasts,
        sunrise: daySun?.sunrise,
        sunset: daySun?.sunset,
        tidalExtremes: tidalExtremes.length > 0 ? tidalExtremes : undefined,
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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    console.log('Fetching weather for:', lat, lon);

    // Yr.no Locationforecast API (free, requires User-Agent)
    const forecastUrl = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat}&lon=${lon}`;
    
    const response = await fetch(forecastUrl, {
      headers: {
        'User-Agent': 'WindDashboard/1.0 github.com/lovable-wind-dashboard',
      },
    });

    if (!response.ok) {
      console.error('Met.no forecast API error:', response.status, response.statusText);
      throw new Error(`Met.no API error: ${response.status}`);
    }

    const responseData = await response.json();
    const timeseries = responseData.properties?.timeseries || [];

    // Get target hours: 10, 12, 14, 16
    const targetHours = [10, 12, 14, 16];
    
    // Get the next 3 days
    const now = new Date();
    const days: { date: string; forecasts: any[] }[] = [];

    for (let d = 0; d < 3; d++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + d);
      const dateStr = targetDate.toISOString().split('T')[0];

      const dayForecasts: any[] = [];

      for (const hour of targetHours) {
        // Find the closest timeseries entry for this hour
        const targetTime = `${dateStr}T${hour.toString().padStart(2, '0')}:00:00Z`;
        
        const entry = timeseries.find((ts: any) => ts.time === targetTime);
        
        if (entry) {
          const instant = entry.data?.instant?.details;
          dayForecasts.push({
            hour,
            windSpeed: instant?.wind_speed || 0,
            windGust: instant?.wind_speed_of_gust || instant?.wind_speed || 0,
            windDirection: instant?.wind_from_direction || 0,
          });
        } else {
          // Find nearest entry
          const nearestEntry = timeseries.find((ts: any) => {
            const tsDate = new Date(ts.time);
            return tsDate.toISOString().split('T')[0] === dateStr && 
                   tsDate.getUTCHours() >= hour - 1 && 
                   tsDate.getUTCHours() <= hour + 1;
          });
          
          if (nearestEntry) {
            const instant = nearestEntry.data?.instant?.details;
            dayForecasts.push({
              hour,
              windSpeed: instant?.wind_speed || 0,
              windGust: instant?.wind_speed_of_gust || instant?.wind_speed || 0,
              windDirection: instant?.wind_from_direction || 0,
            });
          } else {
            dayForecasts.push({
              hour,
              windSpeed: 0,
              windGust: 0,
              windDirection: 0,
            });
          }
        }
      }

      days.push({
        date: dateStr,
        forecasts: dayForecasts,
      });
    }

    console.log('Processed forecast for', days.length, 'days');

    return new Response(
      JSON.stringify({ days }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

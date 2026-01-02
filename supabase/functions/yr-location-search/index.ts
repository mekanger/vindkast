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
    const { query } = await req.json();

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ locations: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for location:', query);

    // Yr.no uses a typeahead API for location search
    const searchUrl = `https://www.yr.no/api/v0/locations/Search?q=${encodeURIComponent(query)}&language=nb`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'WindDashboard/1.0 github.com/lovable-wind-dashboard',
      },
    });

    if (!response.ok) {
      console.error('Yr.no search API error:', response.status, response.statusText);
      throw new Error(`Yr.no API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Found locations:', data._embedded?.location?.length || 0);

    // Transform to our format
    const locations = (data._embedded?.location || []).slice(0, 10).map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      region: loc.region?.name || '',
      country: loc.country?.name || 'Norge',
      coordinates: {
        lat: loc.position?.lat,
        lon: loc.position?.lon,
      },
    }));

    return new Response(
      JSON.stringify({ locations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in yr-location-search:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, locations: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

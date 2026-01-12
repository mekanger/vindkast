import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Unauthorized: Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !data?.claims) {
      console.log('Unauthorized: Invalid token', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query } = await req.json();

    // Comprehensive input validation
    if (!query || typeof query !== 'string') {
      console.log('Invalid query: not a string');
      return new Response(
        JSON.stringify({ error: 'Invalid query parameter', locations: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (query.length < 2 || query.length > 200) {
      console.log('Invalid query length:', query.length);
      return new Response(
        JSON.stringify({ error: 'Query must be between 2 and 200 characters', locations: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for location:', query, 'by user:', data.claims.sub);

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

    const responseData = await response.json();
    console.log('Found locations:', responseData._embedded?.location?.length || 0);

    // Transform to our format
    const locations = (responseData._embedded?.location || []).slice(0, 10).map((loc: any) => ({
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

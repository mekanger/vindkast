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
    origin === allowed || origin.endsWith('.lovable.app') || origin.endsWith('.gptengineer.run')
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

    // Normalize query for cache key (lowercase, trimmed)
    const normalizedQuery = query.toLowerCase().trim();
    const cacheKey = `search_${normalizedQuery}`;

    // Initialize Supabase client with service role for cache operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('location_search_cache')
      .select('response_data, expires_at')
      .eq('query_key', cacheKey)
      .maybeSingle();

    if (!cacheError && cachedData && new Date(cachedData.expires_at) > new Date()) {
      console.log('Cache hit for search:', normalizedQuery);
      return new Response(
        JSON.stringify(cachedData.response_data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
      );
    }

    console.log('Cache miss - searching for location:', query);

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

    const result = { locations };

    // Store in cache
    const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString();
    
    const { error: upsertError } = await supabase
      .from('location_search_cache')
      .upsert({
        query_key: cacheKey,
        response_data: result,
        cached_at: new Date().toISOString(),
        expires_at: expiresAt,
      }, { onConflict: 'query_key' });

    if (upsertError) {
      console.error('Error caching search results:', upsertError);
    } else {
      console.log('Cached search results for:', normalizedQuery, 'expires:', expiresAt);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
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
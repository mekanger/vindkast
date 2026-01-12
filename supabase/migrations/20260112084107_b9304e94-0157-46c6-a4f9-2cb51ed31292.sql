-- Create weather cache table
CREATE TABLE public.weather_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  response_data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index for fast lookups
CREATE INDEX idx_weather_cache_key ON public.weather_cache(cache_key);
CREATE INDEX idx_weather_cache_expires ON public.weather_cache(expires_at);

-- Enable RLS but allow public read/write for edge functions
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cache (public weather data)
CREATE POLICY "Anyone can read weather cache"
ON public.weather_cache
FOR SELECT
USING (true);

-- Allow anyone to insert cache entries
CREATE POLICY "Anyone can insert weather cache"
ON public.weather_cache
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update cache entries
CREATE POLICY "Anyone can update weather cache"
ON public.weather_cache
FOR UPDATE
USING (true);

-- Allow anyone to delete expired cache entries
CREATE POLICY "Anyone can delete expired cache"
ON public.weather_cache
FOR DELETE
USING (expires_at < now());

-- Create location search cache table
CREATE TABLE public.location_search_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_key TEXT NOT NULL UNIQUE,
  response_data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index for fast lookups
CREATE INDEX idx_location_cache_key ON public.location_search_cache(query_key);
CREATE INDEX idx_location_cache_expires ON public.location_search_cache(expires_at);

-- Enable RLS
ALTER TABLE public.location_search_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cache
CREATE POLICY "Anyone can read location cache"
ON public.location_search_cache
FOR SELECT
USING (true);

-- Allow anyone to insert cache entries
CREATE POLICY "Anyone can insert location cache"
ON public.location_search_cache
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update cache entries
CREATE POLICY "Anyone can update location cache"
ON public.location_search_cache
FOR UPDATE
USING (true);

-- Allow anyone to delete expired cache entries
CREATE POLICY "Anyone can delete expired location cache"
ON public.location_search_cache
FOR DELETE
USING (expires_at < now());
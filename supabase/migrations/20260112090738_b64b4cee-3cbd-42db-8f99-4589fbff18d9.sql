-- Drop existing permissive INSERT/UPDATE policies on weather_cache
DROP POLICY IF EXISTS "Anyone can insert weather cache" ON public.weather_cache;
DROP POLICY IF EXISTS "Anyone can update weather cache" ON public.weather_cache;

-- Create new policies restricted to service_role
CREATE POLICY "Service role can insert weather cache"
ON public.weather_cache
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update weather cache"
ON public.weather_cache
FOR UPDATE
TO service_role
USING (true);

-- Drop existing permissive INSERT/UPDATE policies on location_search_cache
DROP POLICY IF EXISTS "Anyone can insert location cache" ON public.location_search_cache;
DROP POLICY IF EXISTS "Anyone can update location cache" ON public.location_search_cache;

-- Create new policies restricted to service_role
CREATE POLICY "Service role can insert location cache"
ON public.location_search_cache
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update location cache"
ON public.location_search_cache
FOR UPDATE
TO service_role
USING (true);
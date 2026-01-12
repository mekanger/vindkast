-- Add unique constraint to prevent duplicate locations per user
ALTER TABLE public.saved_locations 
ADD CONSTRAINT saved_locations_user_location_unique 
UNIQUE (user_id, location_id);
-- Add wind_unit column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN wind_unit TEXT NOT NULL DEFAULT 'ms' 
CHECK (wind_unit IN ('ms', 'knots'));
-- Add wind_directions column to activity_rules table
-- This is an array of text values representing wind directions
-- NULL or empty array means all wind directions match
ALTER TABLE public.activity_rules 
ADD COLUMN wind_directions text[] DEFAULT NULL;
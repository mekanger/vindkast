-- Add optional temperature range columns to activity_rules
ALTER TABLE public.activity_rules
ADD COLUMN min_temp numeric DEFAULT NULL,
ADD COLUMN max_temp numeric DEFAULT NULL;
-- Make min_gust and max_gust nullable in activity_rules
ALTER TABLE public.activity_rules 
  ALTER COLUMN min_gust DROP NOT NULL,
  ALTER COLUMN max_gust DROP NOT NULL;
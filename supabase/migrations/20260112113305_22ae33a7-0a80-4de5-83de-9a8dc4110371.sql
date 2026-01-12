-- Create activity_rules table for storing user-defined activity rules
CREATE TABLE public.activity_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  location_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  activity TEXT NOT NULL CHECK (activity IN ('windsurfing', 'windfoil', 'wingfoil', 'sup-foil')),
  min_gust NUMERIC NOT NULL,
  max_gust NUMERIC NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.activity_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own rules"
ON public.activity_rules
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rules"
ON public.activity_rules
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rules"
ON public.activity_rules
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rules"
ON public.activity_rules
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_activity_rules_user_priority ON public.activity_rules(user_id, priority);
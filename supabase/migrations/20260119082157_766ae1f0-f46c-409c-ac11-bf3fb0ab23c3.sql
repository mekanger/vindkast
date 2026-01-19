-- Remove the redundant email column from profiles table
-- This addresses the security concern about storing PII unnecessarily
-- The email is already available securely from auth.users

ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Update the handle_new_user function to no longer insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;
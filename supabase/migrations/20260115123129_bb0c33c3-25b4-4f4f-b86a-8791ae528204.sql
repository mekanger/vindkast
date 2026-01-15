-- Add CASCADE deletion for activity_rules when user is deleted
ALTER TABLE public.activity_rules
ADD CONSTRAINT fk_activity_rules_user
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
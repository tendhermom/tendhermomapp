
-- Update any expert profiles to mother first
UPDATE public.profiles SET user_type = 'mother' WHERE user_type = 'expert';

-- Drop tables in dependency order
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.doctor_slots CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;

-- Drop default before changing type
ALTER TABLE public.profiles ALTER COLUMN user_type DROP DEFAULT;

-- Recreate user_type enum without 'expert'
ALTER TYPE public.user_type RENAME TO user_type_old;
CREATE TYPE public.user_type AS ENUM ('mother');
ALTER TABLE public.profiles ALTER COLUMN user_type TYPE public.user_type USING user_type::text::public.user_type;
ALTER TABLE public.profiles ALTER COLUMN user_type SET DEFAULT 'mother'::public.user_type;

-- Update handle_new_user function to remove expert reference
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'mother'::user_type
  );
  RETURN NEW;
END;
$function$;

DROP TYPE public.user_type_old;

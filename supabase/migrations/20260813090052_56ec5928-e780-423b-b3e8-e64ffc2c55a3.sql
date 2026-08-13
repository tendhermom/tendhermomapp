ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_tester boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plus_store text,
  ADD COLUMN IF NOT EXISTS plus_status text,
  ADD COLUMN IF NOT EXISTS plus_last_event text;

UPDATE public.profiles
SET is_tester = true,
    plan_type = 'premium',
    plus_status = 'tester',
    plus_expires_at = NULL
WHERE lower(email) = 'tendhermomtest@gmail.com';
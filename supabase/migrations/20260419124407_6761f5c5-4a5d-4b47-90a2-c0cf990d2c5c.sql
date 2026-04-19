ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS inactivity_alerts_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.inactivity_alerts_enabled IS
'When true, the inactivity-checkin job may SMS emergency contacts after 48h of inactivity. Self check-in push at 24h is always allowed.';
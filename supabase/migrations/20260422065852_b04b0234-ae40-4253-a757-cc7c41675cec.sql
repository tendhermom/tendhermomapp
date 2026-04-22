-- Add deletion_requested_at column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

-- Index to quickly find accounts past the grace window
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_requested_at
ON public.profiles (deletion_requested_at)
WHERE deletion_requested_at IS NOT NULL;

-- Enable extensions needed for scheduled purges
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
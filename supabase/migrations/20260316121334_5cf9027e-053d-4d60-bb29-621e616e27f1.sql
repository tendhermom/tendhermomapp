
-- Remove orphaned validate_day_of_week function
DROP FUNCTION IF EXISTS public.validate_day_of_week();

-- Enable pg_cron and pg_net extensions for scheduled cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Reschedule the purge cron to use service-role auth instead of x-cron-secret.
-- Unschedule any prior versions first (ignore errors if they don't exist).
DO $$
BEGIN
  PERFORM cron.unschedule('purge-deleted-accounts-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'purge-deleted-accounts-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rnxarweuquyftywklsxa.supabase.co/functions/v1/purge-deleted-accounts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
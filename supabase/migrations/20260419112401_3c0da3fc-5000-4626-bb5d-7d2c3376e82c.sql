-- 1. Track when each user last opened the app
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at
  ON public.profiles (last_active_at);

-- Backfill so existing users aren't immediately considered inactive
UPDATE public.profiles SET last_active_at = now() WHERE last_active_at IS NULL OR last_active_at < now() - interval '7 days';

-- 2. Function the client calls on every app open
CREATE OR REPLACE FUNCTION public.touch_last_active()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  UPDATE public.profiles
    SET last_active_at = now()
    WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.touch_last_active() TO authenticated;

-- 3. Track each inactivity check-in dispatch (prevents repeat spam)
CREATE TABLE IF NOT EXISTS public.inactivity_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  inactive_hours INTEGER NOT NULL,
  channel TEXT NOT NULL DEFAULT 'sms',
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inactivity_alerts_user_sent
  ON public.inactivity_alerts (user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_inactivity_alerts_contact_sent
  ON public.inactivity_alerts (contact_id, sent_at DESC);

ALTER TABLE public.inactivity_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inactivity alerts"
  ON public.inactivity_alerts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all inactivity alerts"
  ON public.inactivity_alerts
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Inserts only via service role (edge function); no public/authenticated insert policy.

-- Rate limiting table for edge functions
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_rate_limits_lookup ON public.rate_limits (user_id, action, created_at DESC);

-- Service-level access only (edge functions use service role key)
CREATE POLICY "Service role only" ON public.rate_limits FOR ALL USING (false);

-- Function to check rate limits: returns true if ALLOWED
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _action text,
  _max_requests int,
  _window_minutes int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count int;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.rate_limits
  WHERE user_id = _user_id
    AND action = _action
    AND created_at > now() - (_window_minutes || ' minutes')::interval;

  IF recent_count >= _max_requests THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limits (user_id, action) VALUES (_user_id, _action);
  RETURN true;
END;
$$;

-- Cleanup old rate limit records daily
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '24 hours';
$$;

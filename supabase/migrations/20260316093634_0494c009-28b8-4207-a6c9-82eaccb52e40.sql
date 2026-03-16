
CREATE TABLE public.triage_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pathway text NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  outcome text NOT NULL,
  severity text NOT NULL,
  recommendation text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.triage_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own sessions"
  ON public.triage_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions"
  ON public.triage_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

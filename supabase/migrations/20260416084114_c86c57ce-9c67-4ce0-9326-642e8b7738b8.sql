
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_verifications_email ON public.email_verifications (email);
CREATE INDEX idx_email_verifications_lookup ON public.email_verifications (email, code, verified);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage verifications (edge functions use service role)
CREATE POLICY "Service role only" ON public.email_verifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

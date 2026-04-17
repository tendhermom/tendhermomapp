ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plus_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS plus_provider text CHECK (plus_provider IN ('apple','google')),
  ADD COLUMN IF NOT EXISTS plus_product_id text,
  ADD COLUMN IF NOT EXISTS plus_original_tx_id text;

CREATE INDEX IF NOT EXISTS idx_profiles_plus_original_tx_id
  ON public.profiles (plus_original_tx_id)
  WHERE plus_original_tx_id IS NOT NULL;
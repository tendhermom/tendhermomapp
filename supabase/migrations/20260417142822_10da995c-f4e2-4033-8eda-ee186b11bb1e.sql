ALTER TABLE public.baby_shower_posts
  ADD COLUMN IF NOT EXISTS birth_type text NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS account_name text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS bank_name text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'baby_shower_posts_birth_type_check') THEN
    ALTER TABLE public.baby_shower_posts
      ADD CONSTRAINT baby_shower_posts_birth_type_check
      CHECK (birth_type IN ('single','twins','triplets','quadruplets'));
  END IF;
END $$;
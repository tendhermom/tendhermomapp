
-- 1) Referrals: stop exposing raw referred_email / referred_phone PII to the referrer.
--    Add a masked display column, then restrict column-level SELECT on the PII fields.

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS referred_contact_masked text
  GENERATED ALWAYS AS (
    CASE
      WHEN referred_phone IS NOT NULL AND length(referred_phone) >= 4
        THEN repeat('•', GREATEST(length(referred_phone) - 4, 0)) || right(referred_phone, 4)
      WHEN referred_email IS NOT NULL AND position('@' in referred_email) > 1
        THEN left(referred_email, 1) || '•••@' || split_part(referred_email, '@', 2)
      ELSE NULL
    END
  ) STORED;

-- Reset privileges, then re-grant only non-PII columns to authenticated users.
REVOKE ALL ON public.referrals FROM authenticated;
REVOKE ALL ON public.referrals FROM anon;

GRANT SELECT
  (id, referrer_id, referred_id, status, reward_claimed, created_at, referred_contact_masked)
  ON public.referrals TO authenticated;

GRANT INSERT
  (referrer_id, referred_email, referred_phone, status)
  ON public.referrals TO authenticated;

GRANT UPDATE
  (status, reward_claimed)
  ON public.referrals TO authenticated;

GRANT DELETE ON public.referrals TO authenticated;

-- Service role keeps full access for admin / edge function paths.
GRANT ALL ON public.referrals TO service_role;

-- Enforce dedup server-side since the client can no longer read referred_phone.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_referrals_referrer_phone
  ON public.referrals (referrer_id, referred_phone)
  WHERE referred_phone IS NOT NULL;


-- 2) Storage buckets: add explicit public-read SELECT policies on storage.objects
--    so the intentional public-read posture is documented (avatars, community-images,
--    baby-shower-images are all required to be publicly displayable via getPublicUrl).

DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
CREATE POLICY "Public can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public can read community images" ON storage.objects;
CREATE POLICY "Public can read community images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community-images');

DROP POLICY IF EXISTS "Public can read baby shower images" ON storage.objects;
CREATE POLICY "Public can read baby shower images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'baby-shower-images');

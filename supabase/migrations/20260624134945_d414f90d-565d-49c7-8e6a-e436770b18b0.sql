
-- 1) Scope storage listing to owners (keeps buckets public for direct getPublicUrl reads, but blocks anon listing of all files)
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read baby shower images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read community images" ON storage.objects;

CREATE POLICY "Owners can list own avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Owners can list own baby shower images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'baby-shower-images' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Owners can list own community images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'community-images' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- 2) Hide raw sender_email PII from post owners; expose only a masked version
ALTER TABLE public.baby_shower_gifts
  ADD COLUMN IF NOT EXISTS sender_email_masked text GENERATED ALWAYS AS (
    CASE
      WHEN sender_email IS NULL OR position('@' in sender_email) < 2 THEN NULL
      ELSE substr(sender_email, 1, 1) || '•••@' || split_part(sender_email, '@', 2)
    END
  ) STORED;

REVOKE SELECT (sender_email) ON public.baby_shower_gifts FROM authenticated;
GRANT SELECT (
  id, post_id, sender_name, sender_email_masked, amount, message, created_at
) ON public.baby_shower_gifts TO authenticated;

-- 3) Allow users to update their own health metrics (correct mistakes)
CREATE POLICY "Users can update own metrics"
  ON public.health_metrics FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

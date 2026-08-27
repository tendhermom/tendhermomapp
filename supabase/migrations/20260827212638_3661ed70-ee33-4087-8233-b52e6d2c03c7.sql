-- 1. Move any bank details stored on baby shower posts into the owner's private gift settings
UPDATE public.profiles p
SET gift_account_name = COALESCE(NULLIF(p.gift_account_name, ''), b.account_name),
    gift_account_number = COALESCE(NULLIF(p.gift_account_number, ''), b.account_number),
    gift_bank_name = COALESCE(NULLIF(p.gift_bank_name, ''), b.bank_name)
FROM (
  SELECT DISTINCT ON (user_id) user_id, account_name, account_number, bank_name
  FROM public.baby_shower_posts
  WHERE account_number IS NOT NULL AND account_number <> ''
  ORDER BY user_id, created_at DESC
) b
WHERE p.id = b.user_id;

DROP VIEW IF EXISTS public.baby_shower_posts_public;

ALTER TABLE public.baby_shower_posts
  DROP COLUMN IF EXISTS account_name,
  DROP COLUMN IF EXISTS account_number,
  DROP COLUMN IF EXISTS bank_name;

-- Posts no longer contain sensitive data: signed-in members may read them directly
DROP POLICY IF EXISTS "Owners can view full baby shower post" ON public.baby_shower_posts;
CREATE POLICY "Signed-in members can view baby shower posts"
ON public.baby_shower_posts FOR SELECT TO authenticated
USING (true);

CREATE VIEW public.baby_shower_posts_public
WITH (security_invoker = true) AS
SELECT id, user_id, baby_name, parent_names, gender, birth_type, birth_date, image_url,
       image_urls, month_label, reactions_count, gift_enabled, gift_total, created_at
FROM public.baby_shower_posts;

REVOKE ALL ON public.baby_shower_posts_public FROM anon;
GRANT SELECT ON public.baby_shower_posts_public TO authenticated;
GRANT SELECT ON public.baby_shower_posts_public TO service_role;

-- 2. Community points are private to their owner
DROP POLICY IF EXISTS "Authenticated users can view community points" ON public.community_points;
DROP POLICY IF EXISTS "Users can view all community points" ON public.community_points;
DROP POLICY IF EXISTS "Anyone can view community points" ON public.community_points;
CREATE POLICY "Users can view their own community points"
ON public.community_points FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 3. Align storage read policies with the buckets' intentionally public, shareable images
DROP POLICY IF EXISTS "Owners can list own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owners can list own community images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can list own baby shower images" ON storage.objects;

CREATE POLICY "Shared images are viewable"
ON storage.objects FOR SELECT
USING (bucket_id IN ('avatars', 'community-images', 'baby-shower-images'));
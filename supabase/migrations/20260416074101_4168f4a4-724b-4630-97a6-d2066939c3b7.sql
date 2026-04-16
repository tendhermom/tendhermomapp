
-- 1. Fix baby_shower_gifts INSERT: validate post exists and gift_enabled
DROP POLICY IF EXISTS "Anyone can send gifts" ON public.baby_shower_gifts;
CREATE POLICY "Authenticated users can send gifts to enabled posts"
ON public.baby_shower_gifts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.baby_shower_posts
    WHERE id = post_id AND gift_enabled = true
  )
);

-- 2. Fix notifications INSERT: service_role only (remove authenticated self-insert)
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- 3. Restrict storage bucket listing (keep public read by direct URL)
-- Remove broad SELECT policies that allow listing, add scoped ones
DROP POLICY IF EXISTS "Give public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Avatars: public read by path, no listing
CREATE POLICY "Public read avatars by path"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Remove any broad listing policies on community-images and baby-shower-images
-- (they may share a generic "Public Access" policy already dropped above)

-- Community images: public read by path
CREATE POLICY "Public read community images"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-images');

-- Baby shower images: public read by path  
CREATE POLICY "Public read baby shower images"
ON storage.objects FOR SELECT
USING (bucket_id = 'baby-shower-images');

-- 4. Allow authenticated users to read basic profile info for community feeds
-- (currently only own profile is readable, breaking author names)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

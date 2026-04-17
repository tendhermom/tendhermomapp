-- profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- baby_shower_posts
DROP POLICY IF EXISTS "Premium users can create posts" ON public.baby_shower_posts;
CREATE POLICY "Authenticated users can create baby shower posts" ON public.baby_shower_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.baby_shower_posts;
CREATE POLICY "Users can update own baby shower posts" ON public.baby_shower_posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.baby_shower_posts;
CREATE POLICY "Users can delete own baby shower posts" ON public.baby_shower_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- community_posts
DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;
CREATE POLICY "Users can create posts" ON public.community_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
CREATE POLICY "Users can update own community posts" ON public.community_posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;
CREATE POLICY "Users can delete own community posts" ON public.community_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_likes
DROP POLICY IF EXISTS "Users can add own likes" ON public.post_likes;
CREATE POLICY "Users can add own likes" ON public.post_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own likes" ON public.post_likes;
CREATE POLICY "Users can remove own likes" ON public.post_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- reactions
DROP POLICY IF EXISTS "Users can add reactions" ON public.reactions;
CREATE POLICY "Users can add reactions" ON public.reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reactions" ON public.reactions;
CREATE POLICY "Users can update own reactions" ON public.reactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own reactions" ON public.reactions;
CREATE POLICY "Users can remove own reactions" ON public.reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_comments
DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
CREATE POLICY "Users can delete own comments" ON public.post_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- emergency_contacts
DROP POLICY IF EXISTS "Users can create own contacts" ON public.emergency_contacts;
CREATE POLICY "Users can create own contacts" ON public.emergency_contacts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own contacts" ON public.emergency_contacts;
CREATE POLICY "Users can update own contacts" ON public.emergency_contacts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own contacts" ON public.emergency_contacts;
CREATE POLICY "Users can delete own contacts" ON public.emergency_contacts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own contacts" ON public.emergency_contacts;
CREATE POLICY "Users can view own contacts" ON public.emergency_contacts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- referrals
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
CREATE POLICY "Users can create referrals" ON public.referrals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

-- notifications
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
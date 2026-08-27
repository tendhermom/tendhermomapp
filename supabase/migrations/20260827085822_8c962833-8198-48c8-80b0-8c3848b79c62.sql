DROP POLICY IF EXISTS "Anyone can view posts" ON public.community_posts;
CREATE POLICY "Authenticated users can view posts" ON public.community_posts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
CREATE POLICY "Authenticated users can view comments" ON public.post_comments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view all likes" ON public.post_likes;
CREATE POLICY "Authenticated users can view likes" ON public.post_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.reactions;
CREATE POLICY "Authenticated users can view reactions" ON public.reactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view all points" ON public.community_points;
CREATE POLICY "Authenticated users can view points" ON public.community_points FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.community_posts, public.post_comments, public.post_likes, public.reactions, public.community_points FROM anon;
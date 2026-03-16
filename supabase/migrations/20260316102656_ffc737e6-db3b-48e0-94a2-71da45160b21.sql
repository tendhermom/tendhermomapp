
-- Indexes for post_likes (hot path: check if user liked, count likes per post)
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON public.post_likes(user_id, post_id);

-- Indexes for post_comments (hot path: fetch comments per post, count)
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);

-- Index for community_posts channel + created_at (feed query)
CREATE INDEX IF NOT EXISTS idx_community_posts_channel_created ON public.community_posts(channel, created_at DESC);

-- Atomic increment/decrement for likes_count (race-condition safe)
CREATE OR REPLACE FUNCTION public.increment_likes(p_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_likes(p_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_post_id;
$$;

-- Atomic increment for comments_count
CREATE OR REPLACE FUNCTION public.increment_comments(p_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = p_post_id;
$$;

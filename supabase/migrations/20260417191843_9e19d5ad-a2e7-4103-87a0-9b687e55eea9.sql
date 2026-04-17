-- ============================================================
-- 1. PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_community_posts_channel_created
  ON public.community_posts (channel, created_at DESC) WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS idx_community_posts_user
  ON public.community_posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created
  ON public.post_comments (post_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_likes_post_user
  ON public.post_likes (post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post
  ON public.reactions (post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, created_at DESC) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_recorded
  ON public.health_metrics (user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_triage_sessions_user_created
  ON public.triage_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action_created
  ON public.rate_limits (user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_baby_shower_posts_created
  ON public.baby_shower_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer
  ON public.referrals (referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user
  ON public.emergency_contacts (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user
  ON public.user_roles (user_id, role);

-- ============================================================
-- 2. PROFILES PRIVACY
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url, current_stage
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- ============================================================
-- 3. COMMUNITY POINTS INTEGRITY
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own points" ON public.community_points;
DROP POLICY IF EXISTS "Users can update own points" ON public.community_points;

-- ============================================================
-- 4. BABY SHOWER BANK DETAILS
-- ============================================================
CREATE OR REPLACE VIEW public.baby_shower_posts_public
WITH (security_invoker = true) AS
SELECT
  id, user_id, baby_name, parent_names, gender, birth_type,
  birth_date, image_url, month_label, reactions_count,
  gift_enabled, gift_total, created_at
FROM public.baby_shower_posts;

GRANT SELECT ON public.baby_shower_posts_public TO authenticated, anon;

DROP POLICY IF EXISTS "Anyone can view baby shower posts" ON public.baby_shower_posts;

DROP POLICY IF EXISTS "Owners can view full baby shower post" ON public.baby_shower_posts;
CREATE POLICY "Owners can view full baby shower post"
  ON public.baby_shower_posts
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. STORAGE PATH ENFORCEMENT
-- ============================================================
-- Replace the loose "Authenticated users can upload ..." policies with path-scoped ones
DROP POLICY IF EXISTS "Authenticated users can upload community images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own community images" ON storage.objects;
CREATE POLICY "Users can upload own community images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can upload baby shower images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own baby shower images" ON storage.objects;
CREATE POLICY "Users can upload own baby shower images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'baby-shower-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 6. RATE LIMIT CLEANUP CRON
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-rate-limits-hourly') THEN
    PERFORM cron.unschedule('cleanup-rate-limits-hourly');
  END IF;
END $$;

SELECT cron.schedule(
  'cleanup-rate-limits-hourly',
  '0 * * * *',
  $$ SELECT public.cleanup_rate_limits(); $$
);
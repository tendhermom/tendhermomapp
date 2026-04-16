
-- Performance indexes for scale

-- Community posts: fast feed by channel
CREATE INDEX IF NOT EXISTS idx_community_posts_channel_created 
  ON public.community_posts (channel, created_at DESC) 
  WHERE is_hidden = false;

CREATE INDEX IF NOT EXISTS idx_community_posts_user 
  ON public.community_posts (user_id);

-- Post comments: fast comment loading
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created 
  ON public.post_comments (post_id, created_at ASC);

-- Post likes: fast like checks + prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_likes_post_user 
  ON public.post_likes (post_id, user_id);

-- Health metrics: fast timeline queries
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_recorded 
  ON public.health_metrics (user_id, recorded_at DESC);

-- Notifications: fast unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON public.notifications (user_id, read) 
  WHERE read = false;

-- Referrals: fast referral list
CREATE INDEX IF NOT EXISTS idx_referrals_referrer 
  ON public.referrals (referrer_id, created_at DESC);

-- Rate limits: fast rate limit checks
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action_created 
  ON public.rate_limits (user_id, action, created_at DESC);

-- Community memberships: fast membership lookups
CREATE INDEX IF NOT EXISTS idx_community_memberships_user 
  ON public.community_memberships (user_id);

-- Emergency contacts: fast contact retrieval
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user 
  ON public.emergency_contacts (user_id);

-- Baby shower posts: fast feed
CREATE INDEX IF NOT EXISTS idx_baby_shower_posts_created 
  ON public.baby_shower_posts (created_at DESC);

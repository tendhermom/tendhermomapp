
-- Reported posts table for content moderation
CREATE TABLE public.reported_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reported_posts ENABLE ROW LEVEL SECURITY;

-- Users can report posts
CREATE POLICY "Users can create reports" ON public.reported_posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view own reports
CREATE POLICY "Users can view own reports" ON public.reported_posts
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- Admins can manage all reports
CREATE POLICY "Admins can manage reports" ON public.reported_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Banned users table
CREATE TABLE public.banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reason text,
  banned_by uuid NOT NULL,
  banned_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(user_id)
);

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Admins can manage bans
CREATE POLICY "Admins can manage bans" ON public.banned_users
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can check if they're banned
CREATE POLICY "Users can check own ban" ON public.banned_users
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Add hidden column to community_posts for moderation
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- Indexes
CREATE INDEX idx_reported_posts_status ON public.reported_posts(status);
CREATE INDEX idx_reported_posts_post ON public.reported_posts(post_id);
CREATE INDEX idx_banned_users_active ON public.banned_users(user_id, is_active);

-- Function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.banned_users
    WHERE user_id = _user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

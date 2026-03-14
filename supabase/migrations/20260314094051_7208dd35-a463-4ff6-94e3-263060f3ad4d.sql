
CREATE TABLE public.community_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  posts_count integer NOT NULL DEFAULT 0,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.community_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all points" ON public.community_points
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own points" ON public.community_points
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own points" ON public.community_points
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

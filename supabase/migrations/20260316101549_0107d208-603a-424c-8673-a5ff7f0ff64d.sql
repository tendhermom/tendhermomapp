-- Create post_likes table
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes" ON public.post_likes FOR SELECT TO public USING (true);
CREATE POLICY "Users can add own likes" ON public.post_likes FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own likes" ON public.post_likes FOR DELETE TO public USING (auth.uid() = user_id);

-- Create post_comments table
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT TO public USING (true);
CREATE POLICY "Users can add comments" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE TO public USING (auth.uid() = user_id);

-- Create community-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('community-images', 'community-images', true);

-- Storage policies for community-images
CREATE POLICY "Anyone can view community images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'community-images');
CREATE POLICY "Authenticated users can upload community images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'community-images');
CREATE POLICY "Users can delete own community images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'community-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Enable realtime for community_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
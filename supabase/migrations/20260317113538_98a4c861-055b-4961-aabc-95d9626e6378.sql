
-- Gift tracking table for Baby Shower premium feature
CREATE TABLE public.baby_shower_gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.baby_shower_posts(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.baby_shower_gifts ENABLE ROW LEVEL SECURITY;

-- Anyone can insert gifts (public gifting)
CREATE POLICY "Anyone can send gifts" ON public.baby_shower_gifts FOR INSERT TO authenticated WITH CHECK (true);

-- Post owner can view gifts for their posts
CREATE POLICY "Post owners can view their gifts" ON public.baby_shower_gifts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.baby_shower_posts WHERE baby_shower_posts.id = post_id AND baby_shower_posts.user_id = auth.uid())
);

-- Add gift_enabled column to baby_shower_posts for premium users
ALTER TABLE public.baby_shower_posts ADD COLUMN IF NOT EXISTS gift_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.baby_shower_posts ADD COLUMN IF NOT EXISTS gift_total NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE INDEX idx_gifts_post_id ON public.baby_shower_gifts (post_id);

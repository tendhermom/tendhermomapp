ALTER TABLE public.reactions REPLICA IDENTITY FULL;
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;
ALTER TABLE public.post_likes REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='post_comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='post_likes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
  END IF;
END $$;
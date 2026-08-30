-- 1) Trigger helper function must not be callable by API roles
REVOKE ALL ON FUNCTION public.sync_baby_shower_reactions() FROM PUBLIC, anon, authenticated;

-- 2) Gift payment records: explicitly lock down modification/removal
REVOKE UPDATE, DELETE ON public.baby_shower_gifts FROM anon, authenticated;
GRANT ALL ON public.baby_shower_gifts TO service_role;

-- 3) Comments: no edit path for clients
REVOKE UPDATE ON public.post_comments FROM anon, authenticated;
GRANT ALL ON public.post_comments TO service_role;
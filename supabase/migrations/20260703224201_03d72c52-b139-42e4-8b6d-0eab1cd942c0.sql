-- Make the public baby-shower view run as its owner (definer), so it bypasses
-- the owner-only RLS on baby_shower_posts and exposes all posts to everyone,
-- while still excluding bank fields (view definition already omits them).
ALTER VIEW public.baby_shower_posts_public SET (security_invoker = false);

-- Make sure client roles can read the view.
GRANT SELECT ON public.baby_shower_posts_public TO anon, authenticated;
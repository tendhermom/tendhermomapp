CREATE OR REPLACE VIEW public.baby_shower_posts_public AS
SELECT id, user_id, baby_name, parent_names, gender, birth_type, birth_date, image_url,
       image_urls, month_label, reactions_count, gift_enabled, gift_total, created_at
FROM public.baby_shower_posts
WHERE auth.uid() IS NOT NULL;

ALTER VIEW public.baby_shower_posts_public SET (security_invoker = false);

REVOKE ALL ON public.baby_shower_posts_public FROM anon;
GRANT SELECT ON public.baby_shower_posts_public TO authenticated;
GRANT SELECT ON public.baby_shower_posts_public TO service_role;
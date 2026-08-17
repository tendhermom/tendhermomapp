ALTER TABLE public.baby_shower_posts ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

UPDATE public.baby_shower_posts
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND coalesce(array_length(image_urls, 1), 0) = 0;

DROP VIEW IF EXISTS public.baby_shower_posts_public;

CREATE VIEW public.baby_shower_posts_public
WITH (security_invoker = true) AS
SELECT id,
    user_id,
    baby_name,
    parent_names,
    gender,
    birth_type,
    birth_date,
    image_url,
    image_urls,
    month_label,
    reactions_count,
    gift_enabled,
    gift_total,
    created_at
   FROM public.baby_shower_posts;

GRANT SELECT ON public.baby_shower_posts_public TO anon, authenticated;
GRANT ALL ON public.baby_shower_posts_public TO service_role;

DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);

CREATE FUNCTION public.get_public_profiles(_user_ids uuid[])
RETURNS TABLE(id uuid, full_name text, avatar_url text, is_plus boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.full_name, p.avatar_url,
         (p.plan_type = 'premium'::plan_type OR p.is_tester) AS is_plus
  FROM public.profiles p
  WHERE p.id = ANY(_user_ids)
    AND auth.uid() IS NOT NULL;
$function$;

REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated, service_role;
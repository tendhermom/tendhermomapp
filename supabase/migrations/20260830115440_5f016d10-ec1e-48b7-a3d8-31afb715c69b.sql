CREATE OR REPLACE FUNCTION public.sync_baby_shower_reactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.baby_shower_posts SET reactions_count = reactions_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.baby_shower_posts SET reactions_count = GREATEST(0, reactions_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS reactions_sync_count ON public.reactions;
CREATE TRIGGER reactions_sync_count
AFTER INSERT OR DELETE ON public.reactions
FOR EACH ROW EXECUTE FUNCTION public.sync_baby_shower_reactions();

UPDATE public.baby_shower_posts p
SET reactions_count = (SELECT count(*) FROM public.reactions r WHERE r.post_id = p.id);

CREATE OR REPLACE FUNCTION public.is_post_owner(_post_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_posts cp WHERE cp.id = _post_id AND cp.user_id = _user_id)
$$;

REVOKE EXECUTE ON FUNCTION public.is_post_owner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_post_owner(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Post owners can delete comments on their post" ON public.post_comments;
CREATE POLICY "Post owners can delete comments on their post"
ON public.post_comments FOR DELETE TO authenticated
USING (public.is_post_owner(post_id, auth.uid()));
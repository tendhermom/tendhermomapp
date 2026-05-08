-- Transactional purge of all user-owned data. Runs as a single transaction so partial
-- deletes can never leave orphaned rows. Auth user removal still happens from the edge
-- function (admin API), which is the only step that cannot run inside Postgres.
CREATE OR REPLACE FUNCTION public.purge_user_data(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  DELETE FROM public.post_comments        WHERE user_id = _user_id;
  DELETE FROM public.post_likes           WHERE user_id = _user_id;
  DELETE FROM public.reactions            WHERE user_id = _user_id;
  DELETE FROM public.community_posts      WHERE user_id = _user_id;
  DELETE FROM public.community_memberships WHERE user_id = _user_id;
  DELETE FROM public.community_points     WHERE user_id = _user_id;
  DELETE FROM public.baby_shower_posts    WHERE user_id = _user_id;
  DELETE FROM public.emergency_contacts   WHERE user_id = _user_id;
  DELETE FROM public.emergency_alerts     WHERE user_id = _user_id;
  DELETE FROM public.inactivity_alerts    WHERE user_id = _user_id;
  DELETE FROM public.notifications        WHERE user_id = _user_id;
  DELETE FROM public.triage_sessions      WHERE user_id = _user_id;
  DELETE FROM public.health_metrics       WHERE user_id = _user_id;
  DELETE FROM public.referrals            WHERE user_id = _user_id;
  DELETE FROM public.user_roles           WHERE user_id = _user_id;
  DELETE FROM public.rate_limits          WHERE user_id = _user_id;
  DELETE FROM public.reported_posts       WHERE user_id = _user_id OR reporter_id = _user_id;
  DELETE FROM public.profiles             WHERE id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_user_data(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_user_data(uuid) TO service_role;
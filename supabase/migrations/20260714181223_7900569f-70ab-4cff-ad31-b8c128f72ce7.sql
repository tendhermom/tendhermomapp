CREATE OR REPLACE FUNCTION public.purge_user_data(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  DELETE FROM public.referrals            WHERE referrer_id = _user_id OR referred_id = _user_id;
  DELETE FROM public.user_roles           WHERE user_id = _user_id;
  DELETE FROM public.rate_limits          WHERE user_id = _user_id;
  DELETE FROM public.reported_posts       WHERE reporter_id = _user_id OR reviewed_by = _user_id;
  DELETE FROM public.profiles             WHERE id = _user_id;
END;
$function$;

DO $$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id FROM public.profiles WHERE lower(email) = 'engeecpaqueen@gmail.com';
  IF target_id IS NOT NULL THEN
    PERFORM public.purge_user_data(target_id);
    DELETE FROM auth.users WHERE id = target_id;
  END IF;
END $$;
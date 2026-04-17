-- Fully remove the "Igwe Mike" test account and all related data
DO $$
DECLARE
  target_id uuid := '6ac0f2f9-9c8b-47c7-a614-eec8f1d1970e';
BEGIN
  DELETE FROM public.post_likes WHERE user_id = target_id;
  DELETE FROM public.post_comments WHERE user_id = target_id;
  DELETE FROM public.reactions WHERE user_id = target_id;
  DELETE FROM public.community_posts WHERE user_id = target_id;
  DELETE FROM public.community_memberships WHERE user_id = target_id;
  DELETE FROM public.community_points WHERE user_id = target_id;
  DELETE FROM public.baby_shower_gifts WHERE post_id IN (SELECT id FROM public.baby_shower_posts WHERE user_id = target_id);
  DELETE FROM public.baby_shower_posts WHERE user_id = target_id;
  DELETE FROM public.emergency_alerts WHERE user_id = target_id;
  DELETE FROM public.emergency_contacts WHERE user_id = target_id;
  DELETE FROM public.health_metrics WHERE user_id = target_id;
  DELETE FROM public.notifications WHERE user_id = target_id;
  DELETE FROM public.referrals WHERE referrer_id = target_id OR referred_id = target_id;
  DELETE FROM public.reported_posts WHERE reporter_id = target_id OR reviewed_by = target_id;
  DELETE FROM public.triage_sessions WHERE user_id = target_id;
  DELETE FROM public.banned_users WHERE user_id = target_id OR banned_by = target_id;
  DELETE FROM public.user_roles WHERE user_id = target_id;
  DELETE FROM public.rate_limits WHERE user_id = target_id;
  DELETE FROM public.profiles WHERE id = target_id;
  DELETE FROM auth.users WHERE id = target_id;
END $$;
DO $$
DECLARE
  admin_id uuid;
  seed_id uuid;
BEGIN
  -- Promote tendhermom@gmail.com to admin
  SELECT id INTO admin_id FROM auth.users WHERE email = 'tendhermom@gmail.com' LIMIT 1;
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_id, 'admin'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Fully purge seed@tend.app
  SELECT id INTO seed_id FROM auth.users WHERE email = 'seed@tend.app' LIMIT 1;
  IF seed_id IS NOT NULL THEN
    DELETE FROM public.post_likes WHERE user_id = seed_id;
    DELETE FROM public.post_comments WHERE user_id = seed_id;
    DELETE FROM public.reactions WHERE user_id = seed_id;
    DELETE FROM public.community_posts WHERE user_id = seed_id;
    DELETE FROM public.community_memberships WHERE user_id = seed_id;
    DELETE FROM public.community_points WHERE user_id = seed_id;
    DELETE FROM public.baby_shower_gifts WHERE post_id IN (SELECT id FROM public.baby_shower_posts WHERE user_id = seed_id);
    DELETE FROM public.baby_shower_posts WHERE user_id = seed_id;
    DELETE FROM public.emergency_alerts WHERE user_id = seed_id;
    DELETE FROM public.emergency_contacts WHERE user_id = seed_id;
    DELETE FROM public.health_metrics WHERE user_id = seed_id;
    DELETE FROM public.notifications WHERE user_id = seed_id;
    DELETE FROM public.referrals WHERE referrer_id = seed_id OR referred_id = seed_id;
    DELETE FROM public.reported_posts WHERE reporter_id = seed_id OR reviewed_by = seed_id;
    DELETE FROM public.triage_sessions WHERE user_id = seed_id;
    DELETE FROM public.banned_users WHERE user_id = seed_id OR banned_by = seed_id;
    DELETE FROM public.user_roles WHERE user_id = seed_id;
    DELETE FROM public.rate_limits WHERE user_id = seed_id;
    DELETE FROM public.profiles WHERE id = seed_id;
    DELETE FROM auth.users WHERE id = seed_id;
  END IF;
END $$;

-- 1. Explicit RESTRICTIVE policy on user_roles to block non-admin writes
DROP POLICY IF EXISTS "Only admins can modify roles" ON public.user_roles;
CREATE POLICY "Only admins can modify roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Revoke EXECUTE on all SECURITY DEFINER functions from PUBLIC and anon
REVOKE EXECUTE ON FUNCTION public.touch_last_active()                              FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_likes(uuid)                            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrement_likes(uuid)                            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_comments(uuid)                         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.award_community_points(uuid, integer, text)      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer)   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_user_banned(uuid)                             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)                         FROM PUBLIC, anon;

-- Re-grant only to authenticated for app-callable helpers
GRANT EXECUTE ON FUNCTION public.touch_last_active()                               TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_likes(uuid)                             TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_likes(uuid)                             TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_comments(uuid)                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_community_points(uuid, integer, text)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_banned(uuid)                              TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role)                          TO authenticated;

-- 3. Fully lock down internal-only / trigger / admin functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()                       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_referral_reward()                          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits()                            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_user_data(uuid)                            FROM PUBLIC, anon, authenticated;


-- Final security hardening sweep

-- 1) baby_shower_gifts: hide raw sender_email from post owners via column-level grants
REVOKE SELECT ON public.baby_shower_gifts FROM authenticated, anon;
GRANT SELECT (id, post_id, sender_name, sender_email_masked, amount, currency, message, status, created_at)
  ON public.baby_shower_gifts TO authenticated;
GRANT ALL ON public.baby_shower_gifts TO service_role;

-- 2) referrals: hide raw referred_email / referred_phone from referrers via column-level grants
REVOKE SELECT ON public.referrals FROM authenticated, anon;
GRANT SELECT (id, referrer_id, referred_id, status, reward_claimed, created_at, referred_contact_masked)
  ON public.referrals TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

-- 3) user_roles: explicit restrictive INSERT/UPDATE/DELETE guards so non-admins can never self-promote
DROP POLICY IF EXISTS "Block non-admin role inserts" ON public.user_roles;
CREATE POLICY "Block non-admin role inserts"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Block non-admin role updates" ON public.user_roles;
CREATE POLICY "Block non-admin role updates"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated, anon
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Block non-admin role deletes" ON public.user_roles;
CREATE POLICY "Block non-admin role deletes"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated, anon
  USING (public.has_role(auth.uid(), 'admin'::app_role));

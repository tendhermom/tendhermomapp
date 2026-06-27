-- Re-grant EXECUTE on touch_last_active to authenticated users.
-- This function is SECURITY DEFINER and only updates the caller's own row (auth.uid()),
-- so it is safe to expose to all authenticated sessions. It is called on every
-- login/foreground event; without this grant, every login surfaces a server-side error.
GRANT EXECUTE ON FUNCTION public.touch_last_active() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_last_active() FROM anon, public;
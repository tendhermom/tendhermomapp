ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rc_entitlement text;

COMMENT ON COLUMN public.profiles.rc_entitlement IS 'RevenueCat entitlement identifier (e.g. thm-plus) as reported by RevenueCat webhooks/sync; NULL when no active RC entitlement.';
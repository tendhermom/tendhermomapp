
-- Add phone column to referrals
ALTER TABLE public.referrals ADD COLUMN referred_phone TEXT;

-- Make referred_email nullable (phone invites won't have email)
ALTER TABLE public.referrals ALTER COLUMN referred_email DROP NOT NULL;

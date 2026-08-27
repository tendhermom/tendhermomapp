ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plus_provider_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plus_provider_check
  CHECK (plus_provider IS NULL OR plus_provider = ANY (ARRAY['paystack'::text, 'apple'::text, 'google'::text, 'manual'::text]));

-- Restore the member who paid for a weekly plan on 22 Aug but was never upgraded
-- because the old rule rejected the Paystack provider value.
UPDATE public.profiles
SET plan_type = 'premium',
    plus_provider = 'paystack',
    plus_status = 'active',
    plus_product_id = 'PLN_bkz7wnoqgjs1p8v',
    paystack_plan_code = 'PLN_bkz7wnoqgjs1p8v',
    plus_last_event = 'backfill_paid_weekly',
    plus_expires_at = timestamptz '2026-08-22 21:11:54+00' + interval '9 days'
WHERE id = 'dd17b28d-fda5-497d-9311-23c17f4e5765';
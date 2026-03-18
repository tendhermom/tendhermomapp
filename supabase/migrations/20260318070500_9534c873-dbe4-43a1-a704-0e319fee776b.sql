CREATE OR REPLACE FUNCTION public.check_referral_reward()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  referral_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO referral_count
  FROM public.referrals
  WHERE referrer_id = NEW.referrer_id AND status = 'completed';

  IF referral_count >= 5 THEN
    UPDATE public.profiles
    SET plan_type = 'premium'
    WHERE id = NEW.referrer_id AND plan_type = 'free';
  END IF;

  RETURN NEW;
END;
$function$;
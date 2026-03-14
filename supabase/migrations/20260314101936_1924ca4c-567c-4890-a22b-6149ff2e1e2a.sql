
-- Antenatal visits table
CREATE TABLE public.antenatal_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  doctor_name TEXT,
  hospital TEXT,
  notes TEXT,
  week_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.antenatal_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visits" ON public.antenatal_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own visits" ON public.antenatal_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own visits" ON public.antenatal_visits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own visits" ON public.antenatal_visits FOR DELETE USING (auth.uid() = user_id);

-- Test results table
CREATE TABLE public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  test_name TEXT NOT NULL,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  result TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tests" ON public.test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tests" ON public.test_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tests" ON public.test_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tests" ON public.test_results FOR DELETE USING (auth.uid() = user_id);

-- Vitals table
CREATE TABLE public.vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  weight_kg NUMERIC,
  blood_pressure TEXT,
  blood_sugar TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vitals" ON public.vitals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own vitals" ON public.vitals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vitals" ON public.vitals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vitals" ON public.vitals FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-grant premium on 10 referrals
CREATE OR REPLACE FUNCTION public.check_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO referral_count
  FROM public.referrals
  WHERE referrer_id = NEW.referrer_id AND status = 'completed';

  IF referral_count >= 10 THEN
    UPDATE public.profiles
    SET plan_type = 'premium'
    WHERE id = NEW.referrer_id AND plan_type = 'free';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on referral status change
CREATE TRIGGER on_referral_completed
  AFTER INSERT OR UPDATE ON public.referrals
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.check_referral_reward();

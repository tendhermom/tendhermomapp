-- Add user_type to profiles
DO $$ BEGIN
  CREATE TYPE public.user_type AS ENUM ('mother', 'expert');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type user_type NOT NULL DEFAULT 'mother';

-- Expert availability table
CREATE TABLE IF NOT EXISTS public.expert_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id uuid NOT NULL,
  day_of_week integer NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(expert_id, day_of_week)
);

-- Validation trigger for day_of_week
CREATE OR REPLACE FUNCTION public.validate_day_of_week()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.day_of_week < 0 OR NEW.day_of_week > 6 THEN
    RAISE EXCEPTION 'day_of_week must be between 0 and 6';
  END IF;
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'end_time must be after start_time';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_day_of_week ON public.expert_availability;
CREATE TRIGGER check_day_of_week
  BEFORE INSERT OR UPDATE ON public.expert_availability
  FOR EACH ROW EXECUTE FUNCTION public.validate_day_of_week();

ALTER TABLE public.expert_availability ENABLE ROW LEVEL SECURITY;

-- Experts can manage their own availability
CREATE POLICY "Experts manage own availability"
  ON public.expert_availability FOR ALL
  USING (auth.uid() = expert_id)
  WITH CHECK (auth.uid() = expert_id);

-- Anyone authenticated can view expert availability
CREATE POLICY "Anyone can view availability"
  ON public.expert_availability FOR SELECT
  USING (true);

-- Admin policies for profiles (so admin can see all users)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for community_posts
CREATE POLICY "Admins can manage all posts"
  ON public.community_posts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for bookings
CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for emergency_alerts
CREATE POLICY "Admins can view all alerts"
  ON public.emergency_alerts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for referrals
CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for expert_availability
ALTER PUBLICATION supabase_realtime ADD TABLE public.expert_availability;
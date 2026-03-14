
-- Performance indexes for 100K concurrent users
CREATE INDEX IF NOT EXISTS idx_community_posts_channel ON public.community_posts (channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders (user_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts (user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_id ON public.emergency_alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_antenatal_visits_user_id ON public.antenatal_visits (user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON public.test_results (user_id);
CREATE INDEX IF NOT EXISTS idx_vitals_user_id ON public.vitals (user_id);
CREATE INDEX IF NOT EXISTS idx_community_points_user_id ON public.community_points (user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON public.profiles (plan_type);

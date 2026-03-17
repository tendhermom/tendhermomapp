
-- Doctors table
CREATE TABLE public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  specialty text NOT NULL,
  avatar_url text,
  bio text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active doctors" ON public.doctors
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Availability slots
CREATE TABLE public.doctor_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  slot_date date NOT NULL,
  slot_time time NOT NULL,
  is_booked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, slot_date, slot_time)
);

ALTER TABLE public.doctor_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view available slots" ON public.doctor_slots
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage slots" ON public.doctor_slots
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  slot_id uuid REFERENCES public.doctor_slots(id) ON DELETE CASCADE NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for fast queries
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_doctor_slots_date ON public.doctor_slots(slot_date, is_booked);
CREATE INDEX idx_doctor_slots_doctor ON public.doctor_slots(doctor_id, slot_date);

-- Seed some doctors
INSERT INTO public.doctors (full_name, specialty, bio) VALUES
  ('Dr. Adebayo Okonkwo', 'Obstetrician', 'Over 15 years of experience in maternal care across Lagos and Abuja.'),
  ('Dr. Ngozi Eze', 'Gynaecologist', 'Specialist in high-risk pregnancies with a compassionate approach.'),
  ('Dr. Funke Adeyemi', 'Midwife Specialist', 'Certified nurse-midwife focused on holistic prenatal and postnatal care.');

-- Seed availability slots for next 14 days
INSERT INTO public.doctor_slots (doctor_id, slot_date, slot_time)
SELECT d.id, dates.d, times.t
FROM public.doctors d
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + interval '13 days', interval '1 day') AS dates(d)
CROSS JOIN (VALUES ('09:00'::time), ('10:00'::time), ('11:00'::time), ('14:00'::time), ('15:00'::time)) AS times(t)
WHERE EXTRACT(DOW FROM dates.d) BETWEEN 1 AND 5;

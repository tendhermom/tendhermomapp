
CREATE POLICY "Experts can insert own slots"
ON public.doctor_slots
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Experts can update own slots"
ON public.doctor_slots
FOR UPDATE
TO authenticated
USING (auth.uid() = doctor_id);

CREATE POLICY "Experts can view own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (auth.uid() = doctor_id);

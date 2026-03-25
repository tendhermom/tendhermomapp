
CREATE POLICY "Experts can insert own doctor profile"
ON public.doctors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Experts can update own doctor profile"
ON public.doctors
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Experts can delete own slots"
ON public.doctor_slots
FOR DELETE
TO authenticated
USING (auth.uid() = doctor_id);

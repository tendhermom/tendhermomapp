CREATE POLICY "Users can update own reactions"
ON public.reactions
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for baby shower images
INSERT INTO storage.buckets (id, name, public)
VALUES ('baby-shower-images', 'baby-shower-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload baby shower images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'baby-shower-images');

-- Allow public read access
CREATE POLICY "Anyone can view baby shower images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'baby-shower-images');

-- Allow users to delete own uploads
CREATE POLICY "Users can delete own baby shower images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'baby-shower-images' AND (storage.foldername(name))[1] = auth.uid()::text);

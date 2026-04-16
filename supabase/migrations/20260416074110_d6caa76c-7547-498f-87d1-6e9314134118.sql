
-- Make buckets private to prevent listing (files still served via storage API)
UPDATE storage.buckets SET public = false WHERE id = 'avatars';
UPDATE storage.buckets SET public = false WHERE id = 'community-images';
UPDATE storage.buckets SET public = false WHERE id = 'baby-shower-images';

-- Drop redundant broad SELECT policies on storage.objects.
-- Public buckets serve content via getPublicUrl without needing a SELECT policy;
-- these policies only enabled file listing (security warning 0025).
DROP POLICY IF EXISTS "Anyone can view baby shower images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view community images" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar read access" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars by path" ON storage.objects;
DROP POLICY IF EXISTS "Public read baby shower images" ON storage.objects;
DROP POLICY IF EXISTS "Public read community images" ON storage.objects;
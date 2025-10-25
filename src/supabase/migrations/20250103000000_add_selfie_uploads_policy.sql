-- Allow public selfie uploads to photos bucket in selfies/ folder
-- These are temporary uploads that get deleted after face search

INSERT INTO storage.buckets (id, name, public)
VALUES ('selfies', 'selfies', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can upload selfies (temporary)
CREATE POLICY "Anyone can upload temporary selfies"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'selfies' AND
  (storage.foldername(name))[1] = 'temp'
);

-- Policy: Anyone can read selfies (for face detection)
CREATE POLICY "Anyone can read selfies"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'selfies');

-- Policy: Anyone can delete their selfies (cleanup)
CREATE POLICY "Anyone can delete selfies"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'selfies');

-- Alternative: Update existing photos bucket policy for selfies folder
INSERT INTO storage.buckets (id, name, public)
VALUES ('selfies', 'selfies', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow unauthenticated uploads to selfies/ folder in photos bucket
CREATE POLICY "Allow public selfie uploads in photos bucket"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = 'selfies'
);

-- Allow reading selfies for face detection
CREATE POLICY "Allow reading selfies in photos bucket"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = 'selfies'
);

-- Allow deleting selfies for cleanup
CREATE POLICY "Allow deleting selfies in photos bucket"
ON storage.objects FOR DELETE
TO anon
USING (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = 'selfies'
);


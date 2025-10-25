-- ============================================================
-- FIX: Allow public selfie uploads for face search
-- Execute this in Supabase SQL Editor
-- ============================================================

-- First, drop existing policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Allow public selfie uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow reading selfies" ON storage.objects;
DROP POLICY IF EXISTS "Allow deleting selfies" ON storage.objects;

-- Step 1: Allow anonymous users to upload to selfies/ folder
CREATE POLICY "Allow public selfie uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = 'selfies'
);

-- Step 2: Allow anonymous users to read selfies (for face detection API)
CREATE POLICY "Allow reading selfies"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = 'selfies'
);

-- Step 3: Allow anonymous users to delete selfies (cleanup)
CREATE POLICY "Allow deleting selfies"
ON storage.objects FOR DELETE
TO anon
USING (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = 'selfies'
);

-- Verify policies were created
SELECT
  id,
  name,
  definition
FROM storage.policies
WHERE bucket_id = 'photos'
  AND name LIKE '%selfie%';


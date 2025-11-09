-- Add edited_url column to photos table
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS edited_url TEXT;

-- Update storage policies to allow uploads to edited/ folder
DROP POLICY IF EXISTS "Photographers can upload photos to all folders" ON storage.objects;

CREATE POLICY "Photographers can upload photos to all folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND
  (
    (storage.foldername(name))[1] = 'originals' OR
    (storage.foldername(name))[1] = 'watermarks' OR
    (storage.foldername(name))[1] = 'thumbnails' OR
    (storage.foldername(name))[1] = 'covers' OR
    (storage.foldername(name))[1] = 'edited'
  ) AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('photographer', 'admin')
    AND (
      profiles.photographer_status = 'approved' OR
      profiles.role = 'admin'
    )
  )
);

-- Update the update policy as well
DROP POLICY IF EXISTS "Photographers can update photos in all folders" ON storage.objects;

CREATE POLICY "Photographers can update photos in all folders"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photos' AND
  (
    (storage.foldername(name))[1] = 'originals' OR
    (storage.foldername(name))[1] = 'watermarks' OR
    (storage.foldername(name))[1] = 'thumbnails' OR
    (storage.foldername(name))[1] = 'covers' OR
    (storage.foldername(name))[1] = 'edited'
  ) AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('photographer', 'admin')
    AND (
      profiles.photographer_status = 'approved' OR
      profiles.role = 'admin'
    )
  )
);



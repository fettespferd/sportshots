-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Photographers can upload photos" ON storage.objects;

-- Create new policy that allows photographers to upload to originals, watermarks, and thumbnails
CREATE POLICY "Photographers can upload photos to all folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND
  (
    (storage.foldername(name))[1] = 'originals' OR
    (storage.foldername(name))[1] = 'watermarks' OR
    (storage.foldername(name))[1] = 'thumbnails'
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
DROP POLICY IF EXISTS "Photographers can update own photos" ON storage.objects;

CREATE POLICY "Photographers can update photos in all folders"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photos' AND
  (
    (storage.foldername(name))[1] = 'originals' OR
    (storage.foldername(name))[1] = 'watermarks' OR
    (storage.foldername(name))[1] = 'thumbnails'
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


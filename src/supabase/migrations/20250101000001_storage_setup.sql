-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for photos bucket
-- Allow photographers to upload to originals/
CREATE POLICY "Photographers can upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = 'originals' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'photographer'
    AND profiles.photographer_status = 'approved'
  )
);

-- Allow photographers to update their own photos
CREATE POLICY "Photographers can update own photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = 'originals' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'photographer'
    AND profiles.photographer_status = 'approved'
  )
);

-- Allow photographers to delete their own photos
CREATE POLICY "Photographers can delete own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'photographer'
    AND profiles.photographer_status = 'approved'
  )
);

-- Allow public read access to all photos (for watermarked versions)
CREATE POLICY "Public can view photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'photos');



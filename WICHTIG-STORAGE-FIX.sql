-- ⚠️ WICHTIG: Diese SQL-Befehle MÜSSEN in Supabase ausgeführt werden!
-- Gehe zu: Supabase Dashboard → SQL Editor → "New Query"
-- Kopiere ALLES und klicke auf "Run"

-- 1. Alte restriktive Policies löschen
DROP POLICY IF EXISTS "Photographers can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Photographers can update own photos" ON storage.objects;

-- 2. Neue Policy für alle Ordner (originals, watermarks, thumbnails, covers)
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
    (storage.foldername(name))[1] = 'covers'
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

-- 3. Update Policy
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
    (storage.foldername(name))[1] = 'covers'
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

-- 4. Event Cover Image Spalte hinzufügen
ALTER TABLE events
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 5. Guest Downloads ermöglichen
ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

ALTER TABLE purchases
ALTER COLUMN buyer_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS purchases_stripe_session_id_idx 
ON purchases(stripe_session_id);

-- ✅ Fertig! Nach dem Ausführen sollte alles funktionieren.


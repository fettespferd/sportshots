-- Enable RLS on purchase_photos if not already enabled
ALTER TABLE purchase_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read their own purchase photos" ON purchase_photos;
DROP POLICY IF EXISTS "Allow system to insert purchase photos" ON purchase_photos;

-- Allow authenticated users to read their own purchase photos
CREATE POLICY "Allow authenticated users to read their own purchase photos"
ON purchase_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM purchases
    WHERE purchases.id = purchase_photos.purchase_id
    AND (purchases.buyer_id = auth.uid() OR purchases.buyer_id IS NULL)
  )
);

-- Allow system to insert purchase photos (for both webhook and manual creation)
CREATE POLICY "Allow system to insert purchase photos"
ON purchase_photos
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow anon users to read purchase photos via session_id
CREATE POLICY "Allow anon to read purchase photos via session"
ON purchase_photos
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM purchases
    WHERE purchases.id = purchase_photos.purchase_id
    AND purchases.stripe_session_id IS NOT NULL
  )
);


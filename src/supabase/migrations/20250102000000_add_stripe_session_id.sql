-- Add stripe_session_id to purchases table for guest downloads
ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS purchases_stripe_session_id_idx 
ON purchases(stripe_session_id);

-- Make buyer_id nullable for guest purchases
ALTER TABLE purchases
ALTER COLUMN buyer_id DROP NOT NULL;


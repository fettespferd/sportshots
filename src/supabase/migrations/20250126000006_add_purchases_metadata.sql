-- Add metadata column to purchases table
ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_purchases_metadata ON purchases USING GIN (metadata);


-- Dynamic QR Codes table
-- Allows photographers to create multiple reusable QR codes that can be configured to redirect to different events
CREATE TABLE dynamic_qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photographer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE, -- Unique slug for the QR code URL (e.g., "surf-beach-123")
  name TEXT, -- Optional name/label for the QR code (e.g., "Strand", "Ziellinie")
  event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- Currently assigned event (nullable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_dynamic_qr_codes_photographer_id ON dynamic_qr_codes(photographer_id);
CREATE INDEX idx_dynamic_qr_codes_code ON dynamic_qr_codes(code);
CREATE INDEX idx_dynamic_qr_codes_event_id ON dynamic_qr_codes(event_id);

-- Add comments
COMMENT ON TABLE dynamic_qr_codes IS 'Dynamic QR codes that can be configured to redirect to different events. Photographers can have multiple QR codes.';
COMMENT ON COLUMN dynamic_qr_codes.code IS 'Unique slug for the QR code URL (e.g., /qr/surf-beach-123)';
COMMENT ON COLUMN dynamic_qr_codes.name IS 'Optional name/label for the QR code (e.g., "Strand", "Ziellinie") to help identify it';
COMMENT ON COLUMN dynamic_qr_codes.event_id IS 'Currently assigned event that the QR code redirects to (can be changed)';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_dynamic_qr_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dynamic_qr_codes_updated_at
  BEFORE UPDATE ON dynamic_qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_dynamic_qr_codes_updated_at();

-- Enable Row Level Security
ALTER TABLE dynamic_qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dynamic_qr_codes
-- Everyone can read QR codes (needed for public landing page)
CREATE POLICY "QR codes are viewable by everyone"
  ON dynamic_qr_codes FOR SELECT
  USING (true);

-- Photographers can create their own QR code
CREATE POLICY "Photographers can create own QR code"
  ON dynamic_qr_codes FOR INSERT
  WITH CHECK (
    auth.uid() = photographer_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'photographer' OR profiles.role = 'admin')
    )
  );

-- Photographers can update their own QR code
CREATE POLICY "Photographers can update own QR code"
  ON dynamic_qr_codes FOR UPDATE
  USING (auth.uid() = photographer_id);

-- Photographers can delete their own QR code
CREATE POLICY "Photographers can delete own QR code"
  ON dynamic_qr_codes FOR DELETE
  USING (auth.uid() = photographer_id);


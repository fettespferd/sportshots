-- Add metadata fields to photos table
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS taken_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS camera_make TEXT,
ADD COLUMN IF NOT EXISTS camera_model TEXT,
ADD COLUMN IF NOT EXISTS focal_length TEXT,
ADD COLUMN IF NOT EXISTS aperture TEXT,
ADD COLUMN IF NOT EXISTS shutter_speed TEXT,
ADD COLUMN IF NOT EXISTS iso TEXT,
ADD COLUMN IF NOT EXISTS gps_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS gps_longitude DOUBLE PRECISION;

-- Create index for date searches
CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos(taken_at);
CREATE INDEX IF NOT EXISTS idx_photos_event_taken_at ON photos(event_id, taken_at);

-- Add comments
COMMENT ON COLUMN photos.taken_at IS 'Timestamp when photo was taken (from EXIF data)';
COMMENT ON COLUMN photos.camera_make IS 'Camera manufacturer (e.g., Canon, Nikon)';
COMMENT ON COLUMN photos.camera_model IS 'Camera model (e.g., EOS R5)';
COMMENT ON COLUMN photos.focal_length IS 'Focal length in mm';
COMMENT ON COLUMN photos.aperture IS 'Aperture value (e.g., f/2.8)';
COMMENT ON COLUMN photos.shutter_speed IS 'Shutter speed (e.g., 1/1000)';
COMMENT ON COLUMN photos.iso IS 'ISO sensitivity';
COMMENT ON COLUMN photos.gps_latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN photos.gps_longitude IS 'GPS longitude coordinate';


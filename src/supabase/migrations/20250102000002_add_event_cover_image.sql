-- Add cover_image_url column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add comment
COMMENT ON COLUMN events.cover_image_url IS 'URL to the event cover image/banner';


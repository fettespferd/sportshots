-- Add Hyrox/CrossFit specific fields to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_category TEXT CHECK (event_category IN ('singles', 'doubles', 'relay', 'team', 'individual')),
ADD COLUMN IF NOT EXISTS division TEXT CHECK (division IN ('pro', 'open', 'rx', 'scaled', 'masters', 'teens')),
ADD COLUMN IF NOT EXISTS heat_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS stations JSONB;

-- Add Hyrox/CrossFit specific fields to photos table
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS station_tag TEXT,
ADD COLUMN IF NOT EXISTS heat_number INTEGER,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS is_finish_line BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS team_partner_bib TEXT;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_photos_station_tag ON photos(station_tag);
CREATE INDEX IF NOT EXISTS idx_photos_heat_number ON photos(heat_number);
CREATE INDEX IF NOT EXISTS idx_photos_category ON photos(category);
CREATE INDEX IF NOT EXISTS idx_photos_is_finish_line ON photos(is_finish_line);
CREATE INDEX IF NOT EXISTS idx_photos_team_partner ON photos(team_partner_bib);

-- Update event_type enum to include new types
-- Note: In PostgreSQL, we need to check if values already exist
DO $$ 
BEGIN
    -- Add new event types if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'hyrox' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_type')
    ) THEN
        ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'hyrox';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- If event_type doesn't exist as enum, events.event_type is just TEXT
        NULL;
END $$;

-- Comments
COMMENT ON COLUMN events.event_category IS 'Event category: singles, doubles, relay, team, individual';
COMMENT ON COLUMN events.division IS 'Competition division: pro, open, rx, scaled, masters, teens';
COMMENT ON COLUMN events.heat_count IS 'Number of heats/waves in this event';
COMMENT ON COLUMN events.stations IS 'JSON array of station names (e.g., ["SkiErg", "Sled Push", "Burpees"])';

COMMENT ON COLUMN photos.station_tag IS 'Station where photo was taken (e.g., SkiErg, Wall Balls)';
COMMENT ON COLUMN photos.heat_number IS 'Heat/Wave number (1, 2, 3, etc.)';
COMMENT ON COLUMN photos.category IS 'Athlete category for this photo';
COMMENT ON COLUMN photos.is_finish_line IS 'TRUE if this is a finish line photo';
COMMENT ON COLUMN photos.team_partner_bib IS 'Bib number of team partner (for doubles/relay)';


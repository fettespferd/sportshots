-- Add search configuration columns to events table
-- Allows photographers to configure which search options are available and visible for their events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS search_config JSONB DEFAULT '{
  "bib_number": { "enabled": true, "visible_by_default": true },
  "selfie_search": { "enabled": true, "visible_by_default": true },
  "date_filter": { "enabled": true, "visible_by_default": true },
  "time_filter": { "enabled": true, "visible_by_default": true },
  "show_metadata": { "enabled": true, "visible_by_default": true },
  "show_exact_time": { "enabled": true, "visible_by_default": true }
}'::jsonb;

-- Add comment
COMMENT ON COLUMN events.search_config IS 'Configuration for search options and metadata display. Controls which features are enabled and visible by default for end customers.';

-- Create index for search config queries
CREATE INDEX IF NOT EXISTS idx_events_search_config ON events USING GIN (search_config);


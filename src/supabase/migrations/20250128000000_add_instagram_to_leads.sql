-- Add Instagram field to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Add comment
COMMENT ON COLUMN leads.instagram IS 'Instagram handle/username (without @)';



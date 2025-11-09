-- Add watermark_edited_url column to photos table
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS watermark_edited_url TEXT;


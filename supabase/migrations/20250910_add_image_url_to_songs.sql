-- Migration: Add image_url column to songs table for cover art
-- Date: 2025-09-10

ALTER TABLE songs
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optional index for queries by presence of image
CREATE INDEX IF NOT EXISTS idx_songs_image_url_not_null ON songs((image_url IS NOT NULL)) WHERE image_url IS NOT NULL;

COMMENT ON COLUMN songs.image_url IS 'Cover image URL provided by Suno API';


-- Add image_url column to songs table
-- This column is needed to store cover images for songs

ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.songs.image_url IS 'URL of the song cover image';

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.songs TO anon;
GRANT ALL PRIVILEGES ON public.songs TO authenticated;
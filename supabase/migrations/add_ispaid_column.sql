-- Add ispaid column to songs table
ALTER TABLE songs ADD COLUMN ispaid BOOLEAN DEFAULT false;

-- Add comment to the column
COMMENT ON COLUMN songs.ispaid IS 'Indicates if the song generation was paid or free';

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON songs TO anon;
GRANT ALL PRIVILEGES ON songs TO authenticated;
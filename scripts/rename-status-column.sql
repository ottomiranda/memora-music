-- Execute this SQL manually in your Supabase SQL Editor
-- This will rename the 'status' column to 'generation_status' to match the code expectations

-- Rename the column
ALTER TABLE songs RENAME COLUMN status TO generation_status;

-- Add check constraint if it doesn't exist
ALTER TABLE songs ADD CONSTRAINT check_generation_status 
    CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed'));

-- Set default value
ALTER TABLE songs ALTER COLUMN generation_status SET DEFAULT 'completed';

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'songs' AND column_name = 'generation_status';
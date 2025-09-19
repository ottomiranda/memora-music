-- Migration: Add freesongsused column to user_creations table
-- Created: 2024
-- Description: Adds the freesongsused column (snake_case) that the backend code expects

-- Add freesongsused field to user_creations table (snake_case version)
ALTER TABLE user_creations ADD COLUMN IF NOT EXISTS freesongsused INTEGER DEFAULT 0;

-- Copy data from freeSongsUsed to freesongsused if freeSongsUsed exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_creations' 
               AND column_name = 'freeSongsUsed') THEN
        UPDATE user_creations 
        SET freesongsused = COALESCE("freeSongsUsed", 0)
        WHERE freesongsused IS NULL OR freesongsused = 0;
    END IF;
END $$;

-- Create index for optimizing queries on freesongsused
CREATE INDEX IF NOT EXISTS idx_user_creations_freesongsused ON user_creations(freesongsused);

-- Add comment to document the column
COMMENT ON COLUMN user_creations.freesongsused IS 'Number of free songs already used by the user (snake_case version)';

-- Grant permissions to anon and authenticated roles
GRANT SELECT, UPDATE ON user_creations TO anon;
GRANT SELECT, UPDATE ON user_creations TO authenticated;
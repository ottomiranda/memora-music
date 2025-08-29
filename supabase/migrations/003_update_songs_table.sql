-- Migration: Update songs table with missing columns for auto-save system
-- Date: 2025-01-28
-- Description: Add missing columns to existing songs table

-- Add missing columns to songs table
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS guest_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS prompt TEXT,
ADD COLUMN IF NOT EXISTS mood VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'COMPLETED',
ADD COLUMN IF NOT EXISTS task_id VARCHAR(255);

-- Add check constraint to ensure either user_id or guest_id is present
ALTER TABLE songs 
DROP CONSTRAINT IF EXISTS songs_user_or_guest_check;

ALTER TABLE songs 
ADD CONSTRAINT songs_user_or_guest_check 
CHECK (
  (user_id IS NOT NULL AND guest_id IS NULL) OR 
  (user_id IS NULL AND guest_id IS NOT NULL)
);

-- Make user_id nullable since we now support guest_id
ALTER TABLE songs 
ALTER COLUMN user_id DROP NOT NULL;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_songs_user_id_created_at ON songs(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_songs_guest_id_created_at ON songs(guest_id, created_at DESC) WHERE guest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_songs_task_id ON songs(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_songs_status ON songs(status);
CREATE INDEX IF NOT EXISTS idx_songs_guest_id_created_at_cleanup ON songs(guest_id, created_at) WHERE guest_id IS NOT NULL;

-- Update RLS policies to handle guest_id
DROP POLICY IF EXISTS "Users can view their own songs" ON songs;
DROP POLICY IF EXISTS "Users can insert their own songs" ON songs;
DROP POLICY IF EXISTS "Service role has full access" ON songs;

-- Policy for authenticated users to view their own songs
CREATE POLICY "Users can view their own songs" ON songs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for authenticated users to insert their own songs
CREATE POLICY "Users can insert their own songs" ON songs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to update their own songs
CREATE POLICY "Users can update their own songs" ON songs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for service role (backend) to have full access
CREATE POLICY "Service role has full access" ON songs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions to roles
GRANT SELECT ON songs TO anon;
GRANT ALL PRIVILEGES ON songs TO authenticated;
GRANT ALL PRIVILEGES ON songs TO service_role;

-- Create or replace the trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_songs_updated_at ON songs;
CREATE TRIGGER update_songs_updated_at
    BEFORE UPDATE ON songs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE songs IS 'Stores generated songs with support for both authenticated users and guests';
COMMENT ON COLUMN songs.user_id IS 'UUID of authenticated user (null for guest songs)';
COMMENT ON COLUMN songs.guest_id IS 'Temporary ID for guest users (null for authenticated users)';
COMMENT ON COLUMN songs.task_id IS 'Suno API task ID for tracking generation status';
COMMENT ON COLUMN songs.status IS 'Generation status: PROCESSING, COMPLETED, PARTIAL, FAILED';
COMMENT ON COLUMN songs.prompt IS 'Original prompt used for song generation';
COMMENT ON COLUMN songs.mood IS 'Mood/style of the generated song';
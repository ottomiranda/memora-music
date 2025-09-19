-- Migration: Add last_used_ip column to user_creations table
-- Created: 2024
-- Description: Adds the last_used_ip column that the backend code expects

-- Add last_used_ip field to user_creations table
ALTER TABLE user_creations ADD COLUMN IF NOT EXISTS last_used_ip TEXT;

-- Create index for optimizing queries on last_used_ip
CREATE INDEX IF NOT EXISTS idx_user_creations_last_used_ip ON user_creations(last_used_ip);

-- Add comment to document the column
COMMENT ON COLUMN user_creations.last_used_ip IS 'Last IP address used by this device/user';

-- Grant permissions to anon and authenticated roles
GRANT SELECT, UPDATE ON user_creations TO anon;
GRANT SELECT, UPDATE ON user_creations TO authenticated;
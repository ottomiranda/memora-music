-- Migration: Add device_id column to user_creations table for device fingerprinting
-- Created: 2024
-- Description: Adds device_id column to track users by device for anti-abuse measures

-- Add device_id column to user_creations table
ALTER TABLE user_creations ADD COLUMN device_id TEXT;

-- Create index for optimizing queries on device_id
CREATE INDEX idx_user_creations_device_id ON user_creations(device_id);

-- Add comment to document the new column
COMMENT ON COLUMN user_creations.device_id IS 'Unique device identifier for tracking usage across sessions and preventing abuse';

-- Note: device_id is nullable to allow existing users without device tracking
-- New anonymous users will be created with device_id when they use free songs
-- Existing authenticated users will have their device_id updated during login
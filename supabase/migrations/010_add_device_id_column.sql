-- Migration: Add device_id column to users table for device fingerprinting
-- Created: 2024
-- Description: Adds device_id column to track users by device for anti-abuse measures

-- Add device_id column to users table
ALTER TABLE users ADD COLUMN device_id TEXT;

-- Create index for optimizing queries on device_id
CREATE INDEX idx_users_device_id ON users(device_id);

-- Add comment to document the new column
COMMENT ON COLUMN users.device_id IS 'Unique device identifier for tracking usage across sessions and preventing abuse';

-- Note: device_id is nullable to allow existing users without device tracking
-- New anonymous users will be created with device_id when they use free songs
-- Existing authenticated users will have their device_id updated during login
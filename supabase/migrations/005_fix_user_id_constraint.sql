-- Migration: Fix user_id constraint to allow null values for guest users
-- Date: 2025-01-28
-- Description: Remove or modify constraints that prevent guest_id usage

-- Drop the problematic constraint that requires user_id to be NOT NULL
ALTER TABLE songs DROP CONSTRAINT IF EXISTS songs_user_id_check;

-- Ensure user_id column allows NULL values
ALTER TABLE songs ALTER COLUMN user_id DROP NOT NULL;

-- Recreate the proper constraint to ensure either user_id or guest_id is present
ALTER TABLE songs 
DROP CONSTRAINT IF EXISTS songs_user_or_guest_check;

ALTER TABLE songs 
ADD CONSTRAINT songs_user_or_guest_check 
CHECK (
  (user_id IS NOT NULL AND guest_id IS NULL) OR 
  (user_id IS NULL AND guest_id IS NOT NULL)
);

-- Add comment
COMMENT ON CONSTRAINT songs_user_or_guest_check ON songs IS 'Ensures either user_id (for authenticated users) or guest_id (for anonymous users) is present, but not both';
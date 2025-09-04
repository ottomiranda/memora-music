-- Migration: Rename status column to generation_status
-- Created: 2025-01-12
-- Description: Renames the status column to generation_status to match the original design

-- Rename the column
ALTER TABLE songs RENAME COLUMN status TO generation_status;

-- Add check constraint if it doesn't exist
ALTER TABLE songs ADD CONSTRAINT check_generation_status 
    CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed'));

-- Set default value
ALTER TABLE songs ALTER COLUMN generation_status SET DEFAULT 'completed';
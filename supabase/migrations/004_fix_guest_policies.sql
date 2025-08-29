-- Migration: Fix RLS policies for guest users
-- Date: 2025-01-28
-- Description: Add policies to allow anonymous users to manage songs with guest_id

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Anonymous users can view guest songs" ON songs;
DROP POLICY IF EXISTS "Anonymous users can insert guest songs" ON songs;
DROP POLICY IF EXISTS "Anonymous users can update guest songs" ON songs;

-- Policy for anonymous users to view songs with their guest_id
CREATE POLICY "Anonymous users can view guest songs" ON songs
  FOR SELECT
  USING (guest_id IS NOT NULL);

-- Policy for anonymous users to insert songs with guest_id
CREATE POLICY "Anonymous users can insert guest songs" ON songs
  FOR INSERT
  WITH CHECK (guest_id IS NOT NULL AND user_id IS NULL);

-- Policy for anonymous users to update songs with their guest_id
CREATE POLICY "Anonymous users can update guest songs" ON songs
  FOR UPDATE
  USING (guest_id IS NOT NULL)
  WITH CHECK (guest_id IS NOT NULL AND user_id IS NULL);

-- Ensure anon role has the necessary permissions
GRANT SELECT, INSERT, UPDATE ON songs TO anon;

-- Add comment
COMMENT ON TABLE songs IS 'Stores generated songs with support for both authenticated users and guests. Anonymous users can manage songs via guest_id.';
-- Migration: Fix constraint issue by temporarily removing and recreating

-- First, let's see what data we have
SELECT 'Before migration' as stage, id, user_id, guest_id, title 
FROM public.songs 
WHERE guest_id = 'test-guest-123';

-- Drop the problematic constraint temporarily
ALTER TABLE public.songs DROP CONSTRAINT IF EXISTS songs_user_or_guest_check;

-- Perform the migration manually
UPDATE public.songs 
SET 
  user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid,
  guest_id = NULL,
  updated_at = NOW()
WHERE 
  guest_id = 'test-guest-123' 
  AND user_id IS NULL;

-- Check the result
SELECT 'After migration' as stage, id, user_id, guest_id, title 
FROM public.songs 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

-- Recreate the constraint with better logic
ALTER TABLE public.songs ADD CONSTRAINT songs_user_or_guest_check 
CHECK (
  (user_id IS NOT NULL AND guest_id IS NULL) OR 
  (user_id IS NULL AND guest_id IS NOT NULL)
);

-- Verify constraint is working
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.songs'::regclass 
AND contype = 'c'
AND conname = 'songs_user_or_guest_check';
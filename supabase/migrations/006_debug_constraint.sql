-- Migration: Debug and fix constraint issue

-- First, let's check the current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.songs'::regclass 
AND contype = 'c';

-- Drop the existing constraint if it exists
ALTER TABLE public.songs DROP CONSTRAINT IF EXISTS songs_user_or_guest_check;

-- Recreate the constraint with proper logic
ALTER TABLE public.songs ADD CONSTRAINT songs_user_or_guest_check 
CHECK (
  (user_id IS NOT NULL AND guest_id IS NULL) OR 
  (user_id IS NULL AND guest_id IS NOT NULL)
);

-- Verify the constraint is working
COMMENT ON CONSTRAINT songs_user_or_guest_check ON public.songs IS 
'Ensures exactly one of user_id or guest_id is set, but not both or neither';
-- Migration: Check current data in songs table

-- Check all songs for the test guest
SELECT id, user_id, guest_id, title, created_at, updated_at
FROM public.songs 
WHERE guest_id = 'test-guest-123';

-- Check constraint definition
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.songs'::regclass 
AND contype = 'c'
AND conname = 'songs_user_or_guest_check';

-- Test the constraint logic manually
SELECT 
  'Both NULL' as test_case,
  (NULL IS NOT NULL AND NULL IS NULL) OR (NULL IS NULL AND NULL IS NOT NULL) as result
UNION ALL
SELECT 
  'Both NOT NULL' as test_case,
  ('test-user' IS NOT NULL AND 'test-guest' IS NULL) OR ('test-user' IS NULL AND 'test-guest' IS NOT NULL) as result
UNION ALL
SELECT 
  'User only' as test_case,
  ('test-user' IS NOT NULL AND NULL IS NULL) OR ('test-user' IS NULL AND NULL IS NOT NULL) as result
UNION ALL
SELECT 
  'Guest only' as test_case,
  (NULL IS NOT NULL AND 'test-guest' IS NULL) OR (NULL IS NULL AND 'test-guest' IS NOT NULL) as result;
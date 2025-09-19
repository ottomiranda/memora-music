-- Debug query to check users table structure and data
-- This will help us understand the current state of the users table

-- Check if status column exists (it should not based on the schema)
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_creations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current users data
SELECT id, email, name, device_id, freesongsused, created_at, last_used_ip
FROM user_creations 
ORDER BY created_at DESC
LIMIT 10;

-- Check for any triggers on users table
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_creations' AND event_object_schema = 'public';

-- Check for any functions that might be adding a status field
SELECT routine_name, routine_type, routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_definition ILIKE '%status%' OR routine_name ILIKE '%status%');
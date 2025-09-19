-- Check and fix permissions for user_creations table
-- This migration will show current permissions and ensure proper access

-- Check current permissions
SELECT 'Current permissions for user_creations:' as info;
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'user_creations' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Check RLS status
SELECT 'RLS status for user_creations:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_creations';

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_creations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_creations TO authenticated;

-- Check permissions after granting
SELECT 'Permissions after granting:' as info;
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'user_creations' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;
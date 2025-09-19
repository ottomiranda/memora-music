-- Fix permissions for songs table
-- Grant SELECT permission to anon role for public song discovery
GRANT SELECT ON songs TO anon;

-- Grant full permissions to authenticated users
GRANT ALL PRIVILEGES ON songs TO authenticated;

-- Check current permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'songs'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;
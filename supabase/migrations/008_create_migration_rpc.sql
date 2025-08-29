-- Migration: Create RPC function for safe guest song migration

-- Create function to migrate guest songs to user
CREATE OR REPLACE FUNCTION migrate_guest_songs_to_user(
  p_guest_id VARCHAR,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  migration_count INTEGER := 0;
BEGIN
  -- Update songs from guest to user in a single atomic operation
  UPDATE public.songs 
  SET 
    user_id = p_user_id,
    guest_id = NULL,
    updated_at = NOW()
  WHERE 
    guest_id = p_guest_id 
    AND user_id IS NULL;
  
  -- Get the number of affected rows
  GET DIAGNOSTICS migration_count = ROW_COUNT;
  
  -- Log the migration
  RAISE NOTICE 'Migrated % songs from guest % to user %', migration_count, p_guest_id, p_user_id;
  
  RETURN migration_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION migrate_guest_songs_to_user(VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_guest_songs_to_user(VARCHAR, UUID) TO anon;

-- Add comment
COMMENT ON FUNCTION migrate_guest_songs_to_user(VARCHAR, UUID) IS 
'Safely migrates guest songs to an authenticated user account';
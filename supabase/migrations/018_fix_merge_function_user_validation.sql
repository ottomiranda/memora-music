-- Fix merge_guest_into_user function to handle user validation
-- This migration ensures the function validates user existence before merging

CREATE OR REPLACE FUNCTION public.merge_guest_into_user(
  p_device_id TEXT,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  guest_record RECORD;
  user_record RECORD;
  temp_device_id TEXT;
  result JSON;
BEGIN
  -- Validate that the user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found in auth.users',
      'user_id', p_user_id
    );
  END IF;

  -- Use advisory lock to prevent race conditions
  PERFORM pg_advisory_lock(hashtext(p_device_id || '::' || p_user_id::text));
  
  BEGIN
    -- Find guest record by device_id (where user_id is null)
    SELECT * INTO guest_record 
    FROM user_creations 
    WHERE device_id = p_device_id AND user_id IS NULL;
    
    -- If no guest record found, nothing to merge
    IF NOT FOUND THEN
      PERFORM pg_advisory_unlock(hashtext(p_device_id || '::' || p_user_id::text));
      RETURN json_build_object(
        'success', false,
        'message', 'No guest record found for device_id',
        'device_id', p_device_id
      );
    END IF;
    
    -- Check if user already has a record
    SELECT * INTO user_record 
    FROM user_creations 
    WHERE user_id = p_user_id;
    
    IF FOUND THEN
      -- User already has a record, merge the counters
      UPDATE user_creations 
      SET 
        freesongsused = COALESCE(user_record.freesongsused, 0) + COALESCE(guest_record.freesongsused, 0),
        creations = COALESCE(user_record.creations, 0) + COALESCE(guest_record.creations, 0),
        updated_at = NOW()
      WHERE user_id = p_user_id;
      
      -- Remove the guest record
      DELETE FROM user_creations WHERE device_id = p_device_id AND user_id IS NULL;
      
      result := json_build_object(
        'success', true,
        'action', 'merged_into_existing',
        'user_id', p_user_id,
        'device_id', p_device_id,
        'final_freesongsused', COALESCE(user_record.freesongsused, 0) + COALESCE(guest_record.freesongsused, 0),
        'final_creations', COALESCE(user_record.creations, 0) + COALESCE(guest_record.creations, 0)
      );
    ELSE
      -- User doesn't have a record, convert guest record to user record
      -- Use temporary device_id to avoid constraint conflicts
      temp_device_id := 'temp_' || extract(epoch from now()) || '_' || p_device_id;
      
      -- First, update to temporary device_id
      UPDATE user_creations 
      SET device_id = temp_device_id
      WHERE device_id = p_device_id AND user_id IS NULL;
      
      -- Then update with user_id and restore original device_id
      UPDATE user_creations 
      SET 
        user_id = p_user_id,
        device_id = p_device_id,
        updated_at = NOW()
      WHERE device_id = temp_device_id;
      
      result := json_build_object(
        'success', true,
        'action', 'converted_guest_to_user',
        'user_id', p_user_id,
        'device_id', p_device_id,
        'final_freesongsused', guest_record.freesongsused,
        'final_creations', guest_record.creations
      );
    END IF;
    
    PERFORM pg_advisory_unlock(hashtext(p_device_id || '::' || p_user_id::text));
    RETURN result;
    
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM pg_advisory_unlock(hashtext(p_device_id || '::' || p_user_id::text));
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'sqlstate', SQLSTATE
      );
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.merge_guest_into_user(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.merge_guest_into_user(TEXT, UUID) TO anon;
-- Fix merge_guest_into_user function to use correct table schema
-- The table user_creations uses device_id as primary key and user_id as foreign key
-- Not an 'id' column

BEGIN;

CREATE OR REPLACE FUNCTION public.merge_guest_into_user(
  p_device_id TEXT,
  p_user_id UUID,
  p_last_ip TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  g RECORD;
  u RECORD;
  combined INTEGER := 0;
  temp_device_id TEXT;
BEGIN
  -- Guard: require identifiers
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'merge_guest_into_user: p_user_id is required';
  END IF;

  -- Serialize on device to avoid race conditions
  PERFORM pg_advisory_xact_lock(hashtext(COALESCE(p_device_id, '')));

  -- Load guest record by device_id
  SELECT * INTO g FROM user_creations WHERE device_id = p_device_id AND user_id IS NULL LIMIT 1;
  
  -- Load authenticated user record by user_id
  SELECT * INTO u FROM user_creations WHERE user_id = p_user_id LIMIT 1;

  -- Ensure authenticated user row exists
  IF u IS NULL THEN
    INSERT INTO user_creations(device_id, user_id, freesongsused, creations, ip, last_used_ip, created_at, updated_at)
    VALUES (p_user_id::text, p_user_id, 0, 0, p_last_ip, p_last_ip, NOW(), NOW())
    ON CONFLICT (device_id) DO NOTHING;
    SELECT * INTO u FROM user_creations WHERE user_id = p_user_id LIMIT 1;
  END IF;

  -- If no guest user found, just ensure authenticated user has correct data
  IF g IS NULL THEN
    -- Update authenticated user record if it exists, or do nothing
    IF u IS NOT NULL THEN
      UPDATE user_creations
      SET last_used_ip = COALESCE(p_last_ip, last_used_ip),
          updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
    
    RETURN json_build_object(
      'user_id', p_user_id,
      'merged_guest', false,
      'combined_freesongsused', COALESCE(u.freesongsused, 0)
    );
  END IF;

  -- Compute consolidated counter
  combined := COALESCE(u.freesongsused, 0) + COALESCE(g.freesongsused, 0);

  -- Create a temporary unique device_id to avoid constraint violation
  temp_device_id := 'temp_' || extract(epoch from now()) || '_' || p_device_id;

  -- First, update guest user with temporary device_id to free the original device_id
  UPDATE user_creations
  SET device_id = temp_device_id
  WHERE device_id = p_device_id AND user_id IS NULL;

  -- Now update or insert authenticated user record with the original device_id and combined data
  INSERT INTO user_creations(device_id, user_id, freesongsused, creations, ip, last_used_ip, created_at, updated_at)
  VALUES (p_device_id, p_user_id, combined, combined, p_last_ip, p_last_ip, NOW(), NOW())
  ON CONFLICT (device_id) DO UPDATE SET
    user_id = p_user_id,
    freesongsused = combined,
    creations = combined,
    last_used_ip = COALESCE(p_last_ip, user_creations.last_used_ip),
    updated_at = NOW();

  -- Finally, remove the guest user (now with temp device_id)
  DELETE FROM user_creations WHERE device_id = temp_device_id;

  RETURN json_build_object(
    'user_id', p_user_id,
    'merged_guest', true,
    'combined_freesongsused', combined
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
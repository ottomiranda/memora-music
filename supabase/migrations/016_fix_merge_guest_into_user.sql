-- Fix merge_guest_into_user function to properly handle unique constraint on device_id
-- The issue is that the constraint is checked during the UPDATE even though we DELETE first
-- Solution: Use a temporary device_id during the merge process

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

  -- Load rows
  SELECT * INTO g FROM users WHERE device_id = p_device_id LIMIT 1;
  SELECT * INTO u FROM users WHERE id = p_user_id LIMIT 1;

  -- Ensure user row exists
  IF u IS NULL THEN
    INSERT INTO users(id, freesongsused, created_at, updated_at)
    VALUES (p_user_id, 0, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    SELECT * INTO u FROM users WHERE id = p_user_id LIMIT 1;
  END IF;

  -- If no guest user found, just ensure authenticated user has correct status
  IF g IS NULL THEN
    UPDATE users
    SET status = 0,
        device_id = COALESCE(device_id, p_device_id),
        last_used_ip = COALESCE(p_last_ip, last_used_ip),
        updated_at = NOW()
    WHERE id = p_user_id;
    
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
  UPDATE users
  SET device_id = temp_device_id
  WHERE id = g.id;

  -- Now update authenticated user with the original device_id and combined data
  UPDATE users
  SET device_id = p_device_id,
      freesongsused = combined,
      status = 0,
      last_used_ip = COALESCE(p_last_ip, last_used_ip),
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Finally, remove the guest user (now with temp device_id)
  DELETE FROM users WHERE id = g.id;

  RETURN json_build_object(
    'user_id', p_user_id,
    'merged_guest', true,
    'combined_freesongsused', combined
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
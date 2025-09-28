-- Fix merge_guest_into_user function to sum freesongsused counters
-- Purpose: Ensure users can only create 1 free song total (anonymous + authenticated)
-- Date: 2025-01-27

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
BEGIN
  -- Guard: require identifiers
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'merge_guest_into_user: p_user_id is required';
  END IF;

  -- Serialize on device to avoid race conditions
  PERFORM pg_advisory_xact_lock(hashtext(COALESCE(p_device_id, '')));

  -- Load rows
  SELECT * INTO g FROM user_creations WHERE device_id = p_device_id AND user_id IS NULL LIMIT 1;
  SELECT * INTO u FROM user_creations WHERE user_id = p_user_id LIMIT 1;

  -- If no authenticated user record exists, we cannot proceed
  IF u IS NULL THEN
    RAISE EXCEPTION 'merge_guest_into_user: No user_creations record found for user_id %', p_user_id;
  END IF;

  -- FIXED: Sum counters instead of using GREATEST to enforce total limit
  -- This ensures that anonymous + authenticated usage counts towards the same limit
  combined := COALESCE(u.freesongsused, 0) + COALESCE(g.freesongsused, 0);

  -- If there's a guest record, merge it into the authenticated user
  IF g IS NOT NULL THEN
    -- Update the authenticated user with combined data
    UPDATE user_creations
    SET freesongsused = combined,
        last_used_ip = COALESCE(p_last_ip, last_used_ip),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Remove the guest record
    DELETE FROM user_creations WHERE device_id = g.device_id AND user_id IS NULL;
  ELSE
    -- No guest record to merge, just update the authenticated user if needed
    UPDATE user_creations
    SET freesongsused = combined,
        last_used_ip = COALESCE(p_last_ip, last_used_ip),
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  RETURN json_build_object(
    'user_id', p_user_id,
    'merged_guest', g IS NOT NULL,
    'combined_freesongsused', combined,
    'guest_freesongsused', COALESCE(g.freesongsused, 0),
    'user_freesongsused', COALESCE(u.freesongsused, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.merge_guest_into_user(TEXT, UUID, TEXT)
IS 'Atomically merge anonymous user (by device_id) into authenticated user (by id), summing freesongsused to enforce total limit.';

COMMIT;
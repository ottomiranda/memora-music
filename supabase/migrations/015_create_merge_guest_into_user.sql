-- Function: merge_guest_into_user
-- Purpose: Atomically merge an anonymous user (by device_id) into an authenticated user (by id)
-- Ensures freesongsused never decreases and transfers device_id to the authenticated row.

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
  SELECT * INTO g FROM user_creations WHERE device_id = p_device_id LIMIT 1;
  SELECT * INTO u FROM user_creations WHERE id = p_user_id LIMIT 1;

  -- Ensure user row exists
  IF u IS NULL THEN
    INSERT INTO user_creations(id, freesongsused, created_at, updated_at)
    VALUES (p_user_id, 0, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    SELECT * INTO u FROM user_creations WHERE id = p_user_id LIMIT 1;
  END IF;

  -- Compute consolidated counter (preserva o maior valor para não ultrapassar o limite)
  combined := GREATEST(COALESCE(u.freesongsused, 0), COALESCE(g.freesongsused, 0));

  -- Remove guest first to free unique(device_id)
  IF g IS NOT NULL THEN
    DELETE FROM user_creations WHERE id = g.id;
  END IF;

  -- Assign device_id and consolidated counter to authenticated user
  -- Also set status = 0 to mark as authenticated user
  UPDATE user_creations
  SET device_id = p_device_id,
      freesongsused = combined,
      status = 0,
      last_used_ip = COALESCE(p_last_ip, last_used_ip),
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'user_id', p_user_id,
    'merged_guest', g IS NOT NULL,
    'combined_freesongsused', combined
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.merge_guest_into_user(TEXT, UUID, TEXT)
IS 'Atomically merge anonymous user (by device_id) into authenticated user (by id), preserving max freesongsused.';

COMMIT;


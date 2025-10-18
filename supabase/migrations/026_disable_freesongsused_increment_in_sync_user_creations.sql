-- Migration: Disable freesongsused increments in sync_user_creations trigger
-- Purpose: Keep creations count in sync, but do NOT touch freesongsused
-- This avoids granting free songs automatically on every insert into songs

BEGIN;

-- Drop existing trigger and function to replace with safe version
DROP TRIGGER IF EXISTS trigger_sync_user_creations ON public.songs;
DROP FUNCTION IF EXISTS public.sync_user_creations();

-- Recreate function without updating freesongsused
CREATE OR REPLACE FUNCTION public.sync_user_creations()
RETURNS TRIGGER AS $$
DECLARE
  computed_device_id TEXT;
BEGIN
  -- Compute device_id from guest_id or user_id
  computed_device_id := COALESCE(NEW.guest_id, NEW.user_id::text);

  IF computed_device_id IS NULL OR computed_device_id = '' THEN
    RAISE WARNING 'sync_user_creations: missing identifiers for song ID %', NEW.id;
    RETURN NEW;
  END IF;

  -- Insert or update user_creations, incrementing ONLY creations
  INSERT INTO public.user_creations (
    device_id,
    creations,
    user_id,
    created_at,
    updated_at
  )
  VALUES (
    computed_device_id,
    1,
    NEW.user_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (device_id)
  DO UPDATE SET 
    creations = user_creations.creations + 1,
    updated_at = NOW(),
    user_id = CASE 
      WHEN user_creations.user_id IS NULL AND NEW.user_id IS NOT NULL THEN NEW.user_id
      ELSE user_creations.user_id
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trigger_sync_user_creations
  AFTER INSERT ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_creations();

-- Documentation
COMMENT ON FUNCTION public.sync_user_creations() IS 'Sync creations count on new song insert; does NOT change freesongsused';
COMMENT ON TRIGGER trigger_sync_user_creations ON public.songs IS 'Updates user_creations.creations only when a new song is created';

COMMIT;
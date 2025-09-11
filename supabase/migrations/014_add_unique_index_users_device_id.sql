-- Ensure a single anonymous user per device
-- Creates a partial unique index on users(device_id) where device_id is not null
-- This prevents duplicated anonymous users for the same device

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_device_id
ON users(device_id)
WHERE device_id IS NOT NULL;

COMMIT;


-- Reset test user data for device test-final-1758232644
-- This will allow testing the paywall flow from scratch

-- Reset user creation count for test user
UPDATE user_creations 
SET creations = 0, freesongsused = 0, updated_at = NOW()
WHERE device_id = 'test-final-1758232644';

-- Delete all songs created by test user (using guest_id column)
DELETE FROM songs 
WHERE guest_id = 'test-final-1758232644';

-- Verify the cleanup
SELECT 'Remaining user_creations records:' as info, COUNT(*) as count 
FROM user_creations 
WHERE device_id = 'test-final-1758232644';

SELECT 'Remaining songs records:' as info, COUNT(*) as count 
FROM songs 
WHERE guest_id = 'test-final-1758232644';
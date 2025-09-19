-- Reset all test user data to ensure clean testing environment
-- This will allow testing the paywall flow from scratch

-- Reset user creation count for all test users
UPDATE user_creations 
SET creations = 0, freesongsused = 0, updated_at = NOW()
WHERE device_id LIKE 'test-%';

-- Delete all songs created by test users
DELETE FROM songs 
WHERE guest_id LIKE 'test-%';

-- Verify the cleanup
SELECT 'Remaining test user_creations records:' as info, COUNT(*) as count 
FROM user_creations 
WHERE device_id LIKE 'test-%';

SELECT 'Remaining test songs records:' as info, COUNT(*) as count 
FROM songs 
WHERE guest_id LIKE 'test-%';
-- Check current admin status
SELECT id, email, username, is_admin, is_banned, status 
FROM profiles 
WHERE id = '13780936-1031-4c22-94a3-194205d7e0d1';

-- Set user as admin if not already
UPDATE profiles 
SET is_admin = true, status = 'active'
WHERE id = '13780936-1031-4c22-94a3-194205d7e0d1';

-- Verify admin status
SELECT id, email, username, is_admin, is_banned, status 
FROM profiles 
WHERE id = '13780936-1031-4c22-94a3-194205d7e0d1';

-- Show all users for comparison
SELECT id, email, username, is_admin, is_banned, status, created_at
FROM profiles 
ORDER BY created_at DESC;

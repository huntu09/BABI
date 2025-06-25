-- First, check what columns exist in profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check current user data (without is_banned column)
SELECT id, email, username, is_admin, balance, created_at
FROM profiles 
WHERE id = '13780936-1031-4c22-94a3-194205d7e0d1';

-- Set user as admin if not already
UPDATE profiles 
SET is_admin = true
WHERE id = '13780936-1031-4c22-94a3-194205d7e0d1';

-- Verify admin status after update
SELECT id, email, username, is_admin, balance, created_at
FROM profiles 
WHERE id = '13780936-1031-4c22-94a3-194205d7e0d1';

-- Show all users for comparison
SELECT id, email, username, is_admin, balance, created_at
FROM profiles 
ORDER BY created_at DESC;

-- Check if there are any pending withdrawals from OTHER users
SELECT w.id, w.user_id, w.amount, w.method, w.status, w.created_at,
       p.email, p.username
FROM withdrawals w
LEFT JOIN profiles p ON w.user_id = p.id
WHERE w.status = 'pending'
ORDER BY w.created_at DESC;

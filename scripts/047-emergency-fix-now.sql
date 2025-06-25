-- 🚨 EMERGENCY: Remove ALL problematic policies immediately

-- 1. Drop ALL policies that might cause recursion
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can access all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Service role can access all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON withdrawals;

-- 2. COMPLETELY DISABLE RLS temporarily to restore access
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;

-- 3. Test database access
SELECT 'Database is now accessible' as status, now() as timestamp;

-- 4. Verify tables are working
SELECT 'Profiles count:' as table_name, count(*) as count FROM profiles
UNION ALL
SELECT 'Withdrawals count:' as table_name, count(*) as count FROM withdrawals;

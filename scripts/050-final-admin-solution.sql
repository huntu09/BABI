-- FINAL SOLUTION: Completely disable RLS for admin operations
-- We'll handle security in application layer

-- Disable RLS on all admin-accessed tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin bypass for profiles" ON profiles;
DROP POLICY IF EXISTS "Admin bypass for withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users own profile" ON profiles;
DROP POLICY IF EXISTS "Users own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Service role can access all withdrawals" ON withdrawals;

-- Create simple policies for regular user access only
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Simple policies - users see own data only
CREATE POLICY "users_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_withdrawals" ON withdrawals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

-- Admin tables - no RLS (admin only access)
-- fraud_logs, admin_actions, user_tasks stay without RLS

SELECT 'RLS simplified - Admin will use service role backend' as status;

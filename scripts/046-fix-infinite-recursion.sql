-- 🚨 URGENT FIX: Remove infinite recursion policies

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can access all withdrawals" ON withdrawals;

-- 2. Temporarily disable RLS for admin operations
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;

-- 3. Create simple policies without recursion
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- 4. Simple profile policy (no recursion)
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- 5. Simple withdrawal policy (no admin check for now)
CREATE POLICY "Users can view own withdrawals" ON withdrawals
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals" ON withdrawals
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. For admin access, we'll use service role in backend
-- No RLS policies needed for admin operations

-- 7. Verify tables are accessible
SELECT 'Profiles accessible' as test, count(*) as count FROM profiles LIMIT 1;
SELECT 'Withdrawals accessible' as test, count(*) as count FROM withdrawals LIMIT 1;

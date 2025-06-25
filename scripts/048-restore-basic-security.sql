-- After emergency fix works, restore basic security (NO ADMIN POLICIES)

-- 1. Re-enable RLS with SAFE policies only
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- 2. Basic user policies (NO RECURSION)
CREATE POLICY "Users own profile" ON profiles
FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users own withdrawals" ON withdrawals  
FOR ALL USING (auth.uid() = user_id);

-- 3. For admin access, we'll use service role in backend API
-- NO RLS policies for admin - handled in application layer

SELECT 'Basic security restored' as status;

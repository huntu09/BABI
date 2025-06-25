-- SOLUSI SEMENTARA: Disable RLS untuk admin dashboard

-- Option 1: Disable RLS completely (NOT RECOMMENDED)
-- ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;

-- Option 2: Create service role policy (RECOMMENDED)
-- Grant admin dashboard service role access to all withdrawals
CREATE POLICY "Service role can access all withdrawals" ON withdrawals
FOR ALL USING (
  -- Allow if using service role key
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  OR
  -- Allow if user is admin (existing logic)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Drop the old admin policy that's not working
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON withdrawals;

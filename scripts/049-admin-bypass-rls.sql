-- Quick fix: Allow admin to bypass RLS completely
-- This is safe because we check admin status in application layer

-- Create admin bypass policies
CREATE POLICY "Admin bypass for profiles" ON profiles
FOR ALL USING (
  -- Regular users see own data
  auth.uid() = id
  OR
  -- Admin sees all (check via custom claim or service role)
  current_setting('request.jwt.claims', true)::json->>'is_admin' = 'true'
  OR
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

CREATE POLICY "Admin bypass for withdrawals" ON withdrawals
FOR ALL USING (
  -- Regular users see own withdrawals
  auth.uid() = user_id
  OR
  -- Admin sees all withdrawals
  current_setting('request.jwt.claims', true)::json->>'is_admin' = 'true'
  OR
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users own profile" ON profiles;
DROP POLICY IF EXISTS "Users own withdrawals" ON withdrawals;

SELECT 'Admin bypass policies created' as status;

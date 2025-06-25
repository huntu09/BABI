-- 🔧 FINAL FIX: Admin RLS Policy yang benar

-- 1. Drop existing policy
DROP POLICY IF EXISTS "Service role can access all withdrawals" ON withdrawals;

-- 2. Create proper admin policy
CREATE POLICY "Admin can access all withdrawals" ON withdrawals
FOR ALL USING (
  -- Check if current user is admin
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 3. Also create policy for profiles table (needed for JOIN)
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles" ON profiles
FOR SELECT USING (
  -- Allow users to see their own profile
  auth.uid() = id
  OR
  -- Allow admins to see all profiles
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.is_admin = true
  )
);

-- 4. Verify admin user exists and is properly set
UPDATE profiles 
SET is_admin = true 
WHERE email IN (
  'admin@dropiyo.com',
  'viniapriani100@gmail.com'  -- Add your admin email here
);

-- 5. Test the policy
SELECT 
  w.*,
  p.email,
  p.username,
  p.balance
FROM withdrawals w
LEFT JOIN profiles p ON w.user_id = p.id
WHERE w.status = 'pending'
LIMIT 5;

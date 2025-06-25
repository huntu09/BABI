-- Fix admin access to withdrawals table
-- Problem: Admin cannot see withdrawals from other users due to missing RLS policy

-- First, check current policies
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'withdrawals';

-- Create admin policy for SELECT (view all withdrawals)
CREATE POLICY "Admins can view all withdrawals" ON withdrawals
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Create admin policy for UPDATE (approve/reject withdrawals)
CREATE POLICY "Admins can update all withdrawals" ON withdrawals
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Verify policies were created
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'withdrawals';

-- Test admin access
SELECT w.id, w.amount, w.status, p.email, p.is_admin
FROM withdrawals w
LEFT JOIN profiles p ON w.user_id = p.id
WHERE w.status = 'pending'
ORDER BY w.created_at DESC;

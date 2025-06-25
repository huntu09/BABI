-- Debug kenapa admin policy gak jalan

-- 1. Cek semua policies yang ada
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'withdrawals'
ORDER BY policyname;

-- 2. Cek apakah policy admin benar-benar ada dan formatnya benar
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'withdrawals' 
AND policyname LIKE '%admin%';

-- 3. Test apakah admin detection berfungsi
SELECT 
  auth.uid() as current_user_id,
  p.id as profile_id,
  p.email,
  p.is_admin,
  CASE 
    WHEN p.is_admin = true THEN 'ADMIN DETECTED'
    ELSE 'NOT ADMIN'
  END as admin_status
FROM profiles p 
WHERE p.id = auth.uid();

-- 4. Test policy condition secara manual
SELECT 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  ) as admin_policy_result;

-- 5. Cek RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'withdrawals';

-- 6. Test query dengan explicit admin check
SELECT w.*, p.email, p.username
FROM withdrawals w
LEFT JOIN profiles p ON w.user_id = p.id
WHERE (
  -- User can see own withdrawals
  w.user_id = auth.uid()
  OR
  -- Admin can see all withdrawals
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
)
ORDER BY w.created_at DESC
LIMIT 10;

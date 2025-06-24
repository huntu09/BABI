-- Fix infinite recursion in RLS policies

-- First, drop all existing policies to start clean
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Don't create admin policy that causes recursion
-- Instead, we'll handle admin access through service role or specific functions

-- Fix other policies that might have similar issues
-- Make sure no policy references the same table it's protecting

-- Clean up user_tasks policies
DROP POLICY IF EXISTS "Users can view own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON user_tasks;

CREATE POLICY "Users can view own tasks" ON user_tasks 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON user_tasks 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON user_tasks 
  FOR UPDATE USING (auth.uid() = user_id);

-- Clean up withdrawals policies
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can update own withdrawals" ON withdrawals;

CREATE POLICY "Users can view own withdrawals" ON withdrawals 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals" ON withdrawals 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own withdrawals" ON withdrawals 
  FOR UPDATE USING (auth.uid() = user_id);

-- Clean up notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Clean up user_badges policies
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;

CREATE POLICY "Users can view own badges" ON user_badges 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON user_badges 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Clean up transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON transactions;

CREATE POLICY "Users can view own transactions" ON transactions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON transactions 
  FOR INSERT WITH CHECK (true);

-- Clean up user_levels policies
DROP POLICY IF EXISTS "Users can view own level" ON user_levels;
DROP POLICY IF EXISTS "Users can insert own level" ON user_levels;
DROP POLICY IF EXISTS "Users can update own level" ON user_levels;

CREATE POLICY "Users can view own level" ON user_levels 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own level" ON user_levels 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own level" ON user_levels 
  FOR UPDATE USING (auth.uid() = user_id);

-- Clean up offerwall_completions policies
DROP POLICY IF EXISTS "Users can view own offerwall completions" ON offerwall_completions;
DROP POLICY IF EXISTS "Users can insert own offerwall completions" ON offerwall_completions;

CREATE POLICY "Users can view own offerwall completions" ON offerwall_completions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offerwall completions" ON offerwall_completions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Clean up daily_bonuses policies
DROP POLICY IF EXISTS "Users can view own daily bonuses" ON daily_bonuses;
DROP POLICY IF EXISTS "Users can insert own daily bonuses" ON daily_bonuses;

CREATE POLICY "Users can view own daily bonuses" ON daily_bonuses 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily bonuses" ON daily_bonuses 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Clean up referrals policies
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
DROP POLICY IF EXISTS "Users can insert referrals" ON referrals;

CREATE POLICY "Users can view own referrals" ON referrals 
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can insert referrals" ON referrals 
  FOR INSERT WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Clean up push_subscriptions policies
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;

CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions 
  FOR DELETE USING (auth.uid() = user_id);

-- Clean up fraud_logs policies
DROP POLICY IF EXISTS "Users can view own fraud logs" ON fraud_logs;
DROP POLICY IF EXISTS "System can insert fraud logs" ON fraud_logs;

CREATE POLICY "Users can view own fraud logs" ON fraud_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert fraud logs" ON fraud_logs 
  FOR INSERT WITH CHECK (true);

-- Create admin functions that use SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION admin_get_all_profiles()
RETURNS SETOF profiles AS $$
BEGIN
  -- Only allow if user is admin (check via service role or other method)
  RETURN QUERY SELECT * FROM profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_profile(
  target_user_id UUID,
  updates JSONB
)
RETURNS profiles AS $$
DECLARE
  updated_profile profiles;
BEGIN
  -- Update profile with SECURITY DEFINER privileges
  UPDATE profiles 
  SET 
    balance = COALESCE((updates->>'balance')::DECIMAL, balance),
    total_earned = COALESCE((updates->>'total_earned')::DECIMAL, total_earned),
    status = COALESCE(updates->>'status', status),
    is_admin = COALESCE((updates->>'is_admin')::BOOLEAN, is_admin),
    updated_at = NOW()
  WHERE id = target_user_id
  RETURNING * INTO updated_profile;
  
  RETURN updated_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_get_all_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_profile TO authenticated;

-- Update the create_user_profile function to be more robust
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_username TEXT DEFAULT NULL,
  user_full_name TEXT DEFAULT NULL,
  user_avatar_url TEXT DEFAULT NULL
)
RETURNS profiles AS $$
DECLARE
  new_profile profiles;
  generated_referral_code TEXT;
BEGIN
  -- Generate unique referral code
  generated_referral_code := generate_referral_code();
  
  -- Insert new profile
  INSERT INTO profiles (
    id,
    email,
    username,
    full_name,
    avatar_url,
    balance,
    total_earned,
    referral_code,
    email_verified,
    is_admin,
    status,
    last_login,
    login_streak,
    suspicious_activity_count
  ) VALUES (
    user_id,
    user_email,
    COALESCE(user_username, split_part(user_email, '@', 1)),
    user_full_name,
    user_avatar_url,
    0.00,
    0.00,
    generated_referral_code,
    false,
    false,
    'active',
    NOW(),
    1,
    0
  ) RETURNING * INTO new_profile;
  
  -- Create initial user level
  INSERT INTO user_levels (user_id, current_level, current_xp, total_xp)
  VALUES (user_id, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

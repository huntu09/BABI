-- Drop existing functions first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_update_profile(UUID, JSONB);
DROP FUNCTION IF EXISTS update_user_balance(UUID, DECIMAL, TEXT, TEXT);
DROP FUNCTION IF EXISTS complete_user_task(UUID, UUID, DECIMAL);
DROP FUNCTION IF EXISTS update_user_xp(UUID, INTEGER);

-- Recreate create_user_profile function with proper parameter naming
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_user_email TEXT,
  p_user_username TEXT DEFAULT NULL,
  p_user_full_name TEXT DEFAULT NULL,
  p_user_avatar_url TEXT DEFAULT NULL
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
    p_user_id,
    p_user_email,
    COALESCE(p_user_username, split_part(p_user_email, '@', 1)),
    p_user_full_name,
    p_user_avatar_url,
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
  
  -- Create initial user level (using prefixed parameter names)
  INSERT INTO user_levels (user_id, current_level, current_xp, total_xp)
  VALUES (p_user_id, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate admin_update_profile function
CREATE OR REPLACE FUNCTION admin_update_profile(
  p_target_user_id UUID,
  p_updates JSONB
)
RETURNS profiles AS $$
DECLARE
  updated_profile profiles;
BEGIN
  -- Update profile with SECURITY DEFINER privileges
  UPDATE profiles 
  SET 
    balance = COALESCE((p_updates->>'balance')::DECIMAL, balance),
    total_earned = COALESCE((p_updates->>'total_earned')::DECIMAL, total_earned),
    status = COALESCE(p_updates->>'status', status),
    is_admin = COALESCE((p_updates->>'is_admin')::BOOLEAN, is_admin),
    updated_at = NOW()
  WHERE id = p_target_user_id
  RETURNING * INTO updated_profile;
  
  RETURN updated_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to update user balance
CREATE OR REPLACE FUNCTION update_user_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_transaction_type TEXT DEFAULT 'earning',
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance DECIMAL;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance 
  FROM profiles 
  WHERE id = p_user_id;
  
  IF current_balance IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update balance
  UPDATE profiles 
  SET 
    balance = balance + p_amount,
    total_earned = CASE 
      WHEN p_amount > 0 THEN total_earned + p_amount 
      ELSE total_earned 
    END,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    description,
    status
  ) VALUES (
    p_user_id,
    p_transaction_type,
    p_amount,
    COALESCE(p_description, 'Balance update'),
    'completed'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to complete tasks safely
CREATE OR REPLACE FUNCTION complete_user_task(
  p_user_id UUID,
  p_task_id UUID,
  p_reward_amount DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  task_reward DECIMAL;
  task_exists BOOLEAN;
BEGIN
  -- Check if task exists and get reward
  SELECT reward_amount, TRUE INTO task_reward, task_exists
  FROM tasks 
  WHERE id = p_task_id AND status = 'active';
  
  IF NOT task_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Use provided reward or task default
  task_reward := COALESCE(p_reward_amount, task_reward);
  
  -- Mark task as completed
  INSERT INTO user_tasks (user_id, task_id, status, completed_at, reward_earned)
  VALUES (p_user_id, p_task_id, 'completed', NOW(), task_reward)
  ON CONFLICT (user_id, task_id) 
  DO UPDATE SET 
    status = 'completed',
    completed_at = NOW(),
    reward_earned = task_reward;
  
  -- Update user balance
  PERFORM update_user_balance(
    p_user_id, 
    task_reward, 
    'task_completion', 
    'Task completed: ' || p_task_id::TEXT
  );
  
  -- Update XP
  PERFORM update_user_xp(p_user_id, 10); -- 10 XP per task
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user XP safely
CREATE OR REPLACE FUNCTION update_user_xp(
  p_user_id UUID,
  p_xp_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  new_level INTEGER;
  current_total_xp INTEGER;
BEGIN
  -- Update XP
  UPDATE user_levels 
  SET 
    current_xp = current_xp + p_xp_amount,
    total_xp = total_xp + p_xp_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Get updated total XP
  SELECT total_xp INTO current_total_xp
  FROM user_levels 
  WHERE user_id = p_user_id;
  
  -- Calculate new level (100 XP per level)
  new_level := (current_total_xp / 100) + 1;
  
  -- Update level if changed
  UPDATE user_levels 
  SET 
    current_level = new_level,
    current_xp = current_total_xp % 100
  WHERE user_id = p_user_id AND current_level != new_level;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_profile TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_balance TO authenticated;
GRANT EXECUTE ON FUNCTION complete_user_task TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_xp TO authenticated;

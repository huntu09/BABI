-- Fix the reference_id type issue in transactions table
CREATE OR REPLACE FUNCTION claim_daily_bonus(
  p_user_id UUID,
  p_bonus_date DATE,
  p_bonus_amount INTEGER,
  p_login_streak INTEGER DEFAULT 1
) RETURNS JSON AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_bonus_decimal DECIMAL;
BEGIN
  -- Check if bonus already claimed today
  IF EXISTS (
    SELECT 1 FROM daily_bonuses 
    WHERE user_id = p_user_id AND bonus_date = p_bonus_date
  ) THEN
    RAISE EXCEPTION 'Daily bonus already claimed today';
  END IF;

  -- Get current balance
  SELECT balance INTO v_current_balance 
  FROM profiles WHERE id = p_user_id;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Calculate new balance (convert points to dollars)
  v_bonus_decimal := p_bonus_amount::DECIMAL / 100;
  v_new_balance := v_current_balance + v_bonus_decimal;

  -- Insert bonus record with correct column names
  INSERT INTO daily_bonuses (user_id, bonus_date, amount, login_streak)
  VALUES (p_user_id, p_bonus_date, p_bonus_amount, p_login_streak);

  -- Update balance atomically
  UPDATE profiles 
  SET balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Insert transaction record with proper UUID for reference_id
  INSERT INTO transactions (user_id, type, amount, description, reference_id)
  VALUES (
    p_user_id, 
    'daily_bonus', 
    p_bonus_amount, 
    'Daily login bonus (streak: ' || p_login_streak || ')', 
    gen_random_uuid()  -- Generate UUID instead of text
  );

  -- Return success with new balance
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'bonus_amount', p_bonus_amount,
    'old_balance', v_current_balance
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Failed to claim daily bonus: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

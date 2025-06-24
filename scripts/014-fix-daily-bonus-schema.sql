-- First, let's check and create the correct daily_bonuses table structure
DO $$ 
BEGIN
    -- Drop the function first if it exists
    DROP FUNCTION IF EXISTS claim_daily_bonus(UUID, DATE, INTEGER, INTEGER);
    DROP FUNCTION IF EXISTS check_daily_bonus_status(UUID, DATE);
    
    -- Check if daily_bonuses table exists and has correct structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_bonuses') THEN
        -- Create daily_bonuses table if it doesn't exist
        CREATE TABLE daily_bonuses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            bonus_date DATE NOT NULL,
            amount INTEGER NOT NULL DEFAULT 25,
            login_streak INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, bonus_date)
        );
        
        -- Create index for performance
        CREATE INDEX idx_daily_bonuses_user_date ON daily_bonuses(user_id, bonus_date);
    ELSE
        -- Check if the table has the correct columns, if not add them
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_bonuses' AND column_name = 'amount') THEN
            ALTER TABLE daily_bonuses ADD COLUMN amount INTEGER NOT NULL DEFAULT 25;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_bonuses' AND column_name = 'login_streak') THEN
            ALTER TABLE daily_bonuses ADD COLUMN login_streak INTEGER DEFAULT 1;
        END IF;
        
        -- Remove points_earned column if it exists (wrong column name)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_bonuses' AND column_name = 'points_earned') THEN
            ALTER TABLE daily_bonuses DROP COLUMN points_earned;
        END IF;
    END IF;
END $$;

-- Create the corrected claim_daily_bonus function
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

  -- Insert transaction record
  INSERT INTO transactions (user_id, type, amount, description, reference_id)
  VALUES (
    p_user_id, 
    'daily_bonus', 
    p_bonus_amount, 
    'Daily login bonus (streak: ' || p_login_streak || ')', 
    'daily_' || p_bonus_date::TEXT
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

-- Create function to check bonus status
CREATE OR REPLACE FUNCTION check_daily_bonus_status(
  p_user_id UUID,
  p_bonus_date DATE
) RETURNS JSON AS $$
DECLARE
  v_claimed BOOLEAN := FALSE;
  v_amount INTEGER := 0;
BEGIN
  -- Check if bonus already claimed and get amount
  SELECT EXISTS (
    SELECT 1 FROM daily_bonuses 
    WHERE user_id = p_user_id AND bonus_date = p_bonus_date
  ), COALESCE(
    (SELECT amount FROM daily_bonuses 
     WHERE user_id = p_user_id AND bonus_date = p_bonus_date LIMIT 1), 0
  ) INTO v_claimed, v_amount;

  RETURN json_build_object(
    'claimed', v_claimed,
    'date', p_bonus_date,
    'amount', v_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION claim_daily_bonus(UUID, DATE, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_daily_bonus_status(UUID, DATE) TO authenticated;

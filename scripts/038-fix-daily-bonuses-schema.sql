-- 🔥 FIX: Daily Bonuses Table Schema Issues
-- Fix nullable user_id, redundant fields, and add business validation

BEGIN;

-- 1. Make user_id NOT NULL (if no orphaned records exist)
DO $$
BEGIN
  -- Check for orphaned records first
  IF NOT EXISTS (SELECT 1 FROM daily_bonuses WHERE user_id IS NULL) THEN
    ALTER TABLE public.daily_bonuses 
    ALTER COLUMN user_id SET NOT NULL;
    
    RAISE NOTICE '✅ Made user_id NOT NULL';
  ELSE
    RAISE WARNING '⚠️ Found orphaned daily_bonuses records with NULL user_id. Clean them first!';
  END IF;
END $$;

-- 2. Add business validation constraints
ALTER TABLE public.daily_bonuses 
ADD CONSTRAINT daily_bonuses_amount_positive 
CHECK (amount > 0);

ALTER TABLE public.daily_bonuses 
ADD CONSTRAINT daily_bonuses_date_not_future 
CHECK (bonus_date <= CURRENT_DATE);

ALTER TABLE public.daily_bonuses 
ADD CONSTRAINT daily_bonuses_streak_positive 
CHECK (streak_count > 0 AND login_streak > 0);

-- 3. Remove duplicate index
DROP INDEX IF EXISTS idx_daily_bonuses_date;
-- Keep idx_daily_bonuses_bonus_date as it's more descriptive

-- 4. Add useful composite index for recent bonuses
CREATE INDEX IF NOT EXISTS idx_daily_bonuses_recent 
ON public.daily_bonuses USING btree (user_id, bonus_date DESC);

-- 5. Create database function for claiming daily bonus (if not exists)
CREATE OR REPLACE FUNCTION claim_daily_bonus(
  p_user_id UUID,
  p_bonus_date DATE,
  p_bonus_amount NUMERIC,
  p_login_streak INTEGER
) RETURNS TABLE(
  success BOOLEAN,
  new_balance NUMERIC,
  bonus_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bonus_id UUID;
  v_new_balance NUMERIC;
BEGIN
  -- Check if bonus already claimed today
  IF EXISTS (
    SELECT 1 FROM daily_bonuses 
    WHERE user_id = p_user_id AND bonus_date = p_bonus_date
  ) THEN
    RETURN QUERY SELECT FALSE, 0::NUMERIC, NULL::UUID;
    RETURN;
  END IF;

  -- Insert daily bonus record
  INSERT INTO daily_bonuses (
    user_id, 
    bonus_date, 
    amount, 
    streak_count, 
    login_streak
  ) VALUES (
    p_user_id,
    p_bonus_date,
    p_bonus_amount / 100.0, -- Convert points to USD
    p_login_streak,
    p_login_streak
  ) RETURNING id INTO v_bonus_id;

  -- Update user balance
  UPDATE profiles 
  SET 
    balance = balance + (p_bonus_amount / 100.0),
    total_earned = total_earned + (p_bonus_amount / 100.0),
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Return success
  RETURN QUERY SELECT TRUE, v_new_balance, v_bonus_id;
END;
$$;

-- 6. Add helpful view for daily bonus analytics
CREATE OR REPLACE VIEW daily_bonus_stats AS
SELECT 
  DATE_TRUNC('month', bonus_date) as month,
  COUNT(*) as total_bonuses,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  AVG(login_streak) as avg_streak
FROM daily_bonuses
GROUP BY DATE_TRUNC('month', bonus_date)
ORDER BY month DESC;

-- 7. Add trigger to validate streak consistency
CREATE OR REPLACE FUNCTION validate_daily_bonus_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure streak_count matches login_streak
  IF NEW.streak_count != NEW.login_streak THEN
    NEW.streak_count := NEW.login_streak;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_bonus_streak_validation
  BEFORE INSERT OR UPDATE ON daily_bonuses
  FOR EACH ROW
  EXECUTE FUNCTION validate_daily_bonus_streak();

COMMIT;

-- 8. Verify the fixes
DO $$
BEGIN
  RAISE NOTICE '🔍 VERIFICATION:';
  RAISE NOTICE '- daily_bonuses constraints: %', (
    SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE table_name = 'daily_bonuses' AND constraint_type = 'CHECK'
  );
  RAISE NOTICE '- daily_bonuses indexes: %', (
    SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'daily_bonuses'
  );
  RAISE NOTICE '✅ Daily bonuses schema fixes completed!';
END $$;

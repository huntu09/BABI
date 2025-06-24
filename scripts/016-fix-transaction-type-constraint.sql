-- Check existing transaction types constraint
DO $$
BEGIN
    -- First, let's see what transaction types are allowed
    RAISE NOTICE 'Checking existing transaction types constraint...';
    
    -- Drop existing check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'transactions_type_check' 
        AND conrelid = 'transactions'::regclass
    ) THEN
        ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;
        RAISE NOTICE 'Dropped existing transactions_type_check constraint';
    END IF;

    -- Add new constraint with daily_bonus included
    ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
    CHECK (type IN (
        'offer_completion',
        'withdrawal',
        'referral_bonus',
        'daily_bonus',
        'bonus',
        'task_completion',
        'survey_completion',
        'admin_adjustment'
    ));
    
    RAISE NOTICE 'Added new transactions_type_check constraint with daily_bonus';
    RAISE NOTICE 'Daily bonus system fixed successfully!';
END $$;

-- Create or replace the daily bonus function with correct transaction type
CREATE OR REPLACE FUNCTION claim_daily_bonus(
    p_user_id UUID,
    p_bonus_date DATE,
    p_bonus_amount INTEGER,
    p_login_streak INTEGER DEFAULT 1
) RETURNS JSON AS $$
DECLARE
    v_current_balance DECIMAL;
    v_new_balance DECIMAL;
    v_result JSON;
BEGIN
    -- Check if bonus already claimed
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

    -- Calculate new balance
    v_new_balance := v_current_balance + (p_bonus_amount::DECIMAL / 100);

    -- Insert bonus record
    INSERT INTO daily_bonuses (user_id, bonus_date, amount, login_streak)
    VALUES (p_user_id, p_bonus_date, p_bonus_amount, p_login_streak);

    -- Update balance atomically
    UPDATE profiles 
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Insert transaction record with correct type
    INSERT INTO transactions (user_id, type, amount, description, reference_id)
    VALUES (
        p_user_id, 
        'daily_bonus', 
        p_bonus_amount, 
        'Daily login bonus (streak: ' || p_login_streak || ')', 
        gen_random_uuid()
    );

    -- Build result
    v_result := json_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'bonus_amount', p_bonus_amount
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to claim daily bonus: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION claim_daily_bonus TO authenticated;

-- Check if daily_bonuses table exists and has correct structure
DO $$
BEGIN
    -- Check if daily_bonuses table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_bonuses') THEN
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
        
        RAISE NOTICE 'Created daily_bonuses table';
    ELSE
        RAISE NOTICE 'daily_bonuses table already exists';
    END IF;
END $$;

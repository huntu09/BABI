-- First, let's see what transaction types currently exist in the database
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Checking existing transaction types in database...';
    
    -- Show all unique transaction types currently in the table
    FOR rec IN 
        SELECT type, COUNT(*) as count 
        FROM transactions 
        GROUP BY type 
        ORDER BY count DESC
    LOOP
        RAISE NOTICE 'Transaction type: %, Count: %', rec.type, rec.count;
    END LOOP;
END $$;

-- Update any invalid transaction types to valid ones
DO $$
BEGIN
    -- Update common invalid types to valid ones
    UPDATE transactions SET type = 'bonus' WHERE type = 'daily_login_bonus';
    UPDATE transactions SET type = 'bonus' WHERE type = 'signup_bonus';
    UPDATE transactions SET type = 'bonus' WHERE type = 'welcome_bonus';
    UPDATE transactions SET type = 'offer_completion' WHERE type = 'offer';
    UPDATE transactions SET type = 'offer_completion' WHERE type = 'task';
    UPDATE transactions SET type = 'survey_completion' WHERE type = 'survey';
    UPDATE transactions SET type = 'referral_bonus' WHERE type = 'referral';
    UPDATE transactions SET type = 'admin_adjustment' WHERE type = 'adjustment';
    UPDATE transactions SET type = 'admin_adjustment' WHERE type = 'manual';
    
    RAISE NOTICE 'Updated invalid transaction types to valid ones';
END $$;

-- Now check again what types we have
DO $$
DECLARE
    rec RECORD;
    invalid_types TEXT[] := ARRAY[]::TEXT[];
    valid_types TEXT[] := ARRAY[
        'offer_completion',
        'withdrawal',
        'referral_bonus',
        'daily_bonus',
        'bonus',
        'task_completion',
        'survey_completion',
        'admin_adjustment'
    ];
BEGIN
    RAISE NOTICE 'Checking transaction types after cleanup...';
    
    -- Find any remaining invalid types
    FOR rec IN 
        SELECT DISTINCT type 
        FROM transactions 
        WHERE type NOT IN (
            'offer_completion',
            'withdrawal',
            'referral_bonus',
            'daily_bonus',
            'bonus',
            'task_completion',
            'survey_completion',
            'admin_adjustment'
        )
    LOOP
        invalid_types := array_append(invalid_types, rec.type);
        RAISE NOTICE 'Found invalid type: %', rec.type;
    END LOOP;
    
    -- If there are still invalid types, update them to 'admin_adjustment'
    IF array_length(invalid_types, 1) > 0 THEN
        UPDATE transactions 
        SET type = 'admin_adjustment' 
        WHERE type = ANY(invalid_types);
        
        RAISE NOTICE 'Updated % invalid transaction types to admin_adjustment', array_length(invalid_types, 1);
    ELSE
        RAISE NOTICE 'All transaction types are now valid';
    END IF;
END $$;

-- Now safely add the constraint
DO $$
BEGIN
    -- Drop existing check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'transactions_type_check' 
        AND conrelid = 'transactions'::regclass
    ) THEN
        ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;
        RAISE NOTICE 'Dropped existing transactions_type_check constraint';
    END IF;

    -- Add new constraint with all valid types
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
    
    RAISE NOTICE 'Successfully added transactions_type_check constraint';
END $$;

-- Create or replace the daily bonus function
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

    -- Calculate new balance (convert points to dollars)
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

-- Ensure daily_bonuses table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_bonuses') THEN
        CREATE TABLE daily_bonuses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            bonus_date DATE NOT NULL,
            amount INTEGER NOT NULL DEFAULT 25,
            login_streak INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, bonus_date)
        );
        
        CREATE INDEX idx_daily_bonuses_user_date ON daily_bonuses(user_id, bonus_date);
        RAISE NOTICE 'Created daily_bonuses table';
    ELSE
        RAISE NOTICE 'daily_bonuses table already exists';
    END IF;
END $$;

-- Final verification
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Final verification - Current transaction types:';
    FOR rec IN 
        SELECT type, COUNT(*) as count 
        FROM transactions 
        GROUP BY type 
        ORDER BY type
    LOOP
        RAISE NOTICE 'Type: %, Count: %', rec.type, rec.count;
    END LOOP;
    
    RAISE NOTICE 'Daily bonus system setup completed successfully!';
END $$;

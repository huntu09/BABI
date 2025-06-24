-- Step 1: Drop the existing constraint first
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
END $$;

-- Step 2: Check what transaction types currently exist
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Current transaction types in database:';
    
    FOR rec IN 
        SELECT type, COUNT(*) as count 
        FROM transactions 
        GROUP BY type 
        ORDER BY count DESC
    LOOP
        RAISE NOTICE 'Type: "%" - Count: %', rec.type, rec.count;
    END LOOP;
END $$;

-- Step 3: Update invalid transaction types safely
DO $$
BEGIN
    -- Update common variations to standard types
    UPDATE transactions SET type = 'bonus' WHERE type ILIKE '%bonus%' AND type != 'referral_bonus' AND type != 'daily_bonus';
    UPDATE transactions SET type = 'offer_completion' WHERE type ILIKE '%offer%' AND type != 'offer_completion';
    UPDATE transactions SET type = 'task_completion' WHERE type ILIKE '%task%' AND type != 'task_completion';
    UPDATE transactions SET type = 'survey_completion' WHERE type ILIKE '%survey%' AND type != 'survey_completion';
    UPDATE transactions SET type = 'referral_bonus' WHERE type ILIKE '%referral%' AND type != 'referral_bonus';
    UPDATE transactions SET type = 'withdrawal' WHERE type ILIKE '%withdraw%' AND type != 'withdrawal';
    
    -- Update any remaining non-standard types to admin_adjustment
    UPDATE transactions 
    SET type = 'admin_adjustment' 
    WHERE type NOT IN (
        'offer_completion',
        'withdrawal', 
        'referral_bonus',
        'daily_bonus',
        'bonus',
        'task_completion',
        'survey_completion',
        'admin_adjustment'
    );
    
    RAISE NOTICE 'Updated transaction types to standard values';
END $$;

-- Step 4: Verify all types are now valid
DO $$
DECLARE
    rec RECORD;
    invalid_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Transaction types after cleanup:';
    
    FOR rec IN 
        SELECT type, COUNT(*) as count 
        FROM transactions 
        GROUP BY type 
        ORDER BY type
    LOOP
        RAISE NOTICE 'Type: "%" - Count: %', rec.type, rec.count;
        
        -- Check if this type is valid
        IF rec.type NOT IN (
            'offer_completion',
            'withdrawal',
            'referral_bonus', 
            'daily_bonus',
            'bonus',
            'task_completion',
            'survey_completion',
            'admin_adjustment'
        ) THEN
            invalid_count := invalid_count + rec.count;
            RAISE NOTICE 'INVALID TYPE FOUND: "%"', rec.type;
        END IF;
    END LOOP;
    
    IF invalid_count = 0 THEN
        RAISE NOTICE 'All transaction types are now valid!';
    ELSE
        RAISE NOTICE 'Still have % invalid transactions', invalid_count;
    END IF;
END $$;

-- Step 5: Add the constraint only if all data is valid
DO $$
DECLARE
    invalid_count INTEGER;
    rec RECORD;
BEGIN
    -- Count invalid transactions
    SELECT COUNT(*) INTO invalid_count
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
    );
    
    IF invalid_count = 0 THEN
        -- Safe to add constraint
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
    ELSE
        RAISE NOTICE 'Cannot add constraint - still have % invalid transactions', invalid_count;
        
        -- Show the invalid ones
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
            RAISE NOTICE 'Invalid type still exists: "%"', rec.type;
        END LOOP;
    END IF;
END $$;

-- Step 6: Create the daily bonus function
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

-- Step 7: Grant permissions and create table
DO $$
BEGIN
    -- Grant execute permission
    EXECUTE 'GRANT EXECUTE ON FUNCTION claim_daily_bonus TO authenticated';
    
    -- Ensure daily_bonuses table exists
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
    
    RAISE NOTICE 'Daily bonus system setup completed!';
END $$;

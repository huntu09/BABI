-- Fix withdrawal status constraint to include 'cancelled'
-- Drop existing constraint
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;

-- Add new constraint with 'cancelled' status
ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled'));

-- Now reset the admin balance properly
UPDATE profiles 
SET balance = 0.00,
    total_earned = 0.00
WHERE id = '13780936-1031-4c22-94a3-194205d7e0d1';

-- Cancel the big withdrawals (now 'cancelled' is allowed)
UPDATE withdrawals 
SET status = 'cancelled',
    processed_at = NOW()
WHERE user_id = '13780936-1031-4c22-94a3-194205d7e0d1'
AND amount > 1000.00;

-- Delete the big negative transactions
DELETE FROM transactions 
WHERE user_id = '13780936-1031-4c22-94a3-194205d7e0d1'
AND amount < -1000.00;

-- Give normal testing balance
UPDATE profiles 
SET balance = 100.00,
    total_earned = 100.00
WHERE id = '13780936-1031-4c22-94a3-194205d7e0d1';

-- Add a transaction record for the reset
INSERT INTO transactions (user_id, type, amount, description, reference_type)
VALUES (
    '13780936-1031-4c22-94a3-194205d7e0d1',
    'admin_adjustment',
    100.00,
    'Balance reset for testing - Admin adjustment',
    'admin_action'
);

-- Final check
SELECT 
    'ADMIN BALANCE RESET RESULTS' as status,
    email,
    balance,
    total_earned,
    (SELECT COUNT(*) FROM withdrawals WHERE user_id = profiles.id AND status = 'completed') as completed_withdrawals,
    (SELECT COUNT(*) FROM withdrawals WHERE user_id = profiles.id AND status = 'cancelled') as cancelled_withdrawals,
    (SELECT COUNT(*) FROM withdrawals WHERE user_id = profiles.id AND status = 'pending') as pending_withdrawals
FROM profiles 
WHERE id = '13780936-1031-4c22-94a3-194205d7e0d1';

-- Show recent transactions
SELECT 
    'RECENT TRANSACTIONS' as status,
    type,
    amount,
    description,
    created_at
FROM transactions 
WHERE user_id = '13780936-1031-4c22-94a3-194205d7e0d1'
ORDER BY created_at DESC 
LIMIT 5;

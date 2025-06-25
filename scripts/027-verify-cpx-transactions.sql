-- Check user balance and total earned
SELECT 
    id,
    username,
    email,
    balance,
    total_earned,
    updated_at
FROM profiles 
WHERE id = '13780936-1031-4c22-94a3-194205d7e0d1';

-- Check all CPX transactions for this user
SELECT 
    id,
    type,
    amount,
    description,
    reference_id,
    created_at
FROM transactions 
WHERE user_id = '13780936-1031-4c22-94a3-194205d7e0d1'
AND reference_id LIKE 'cpx_%'
ORDER BY created_at DESC;

-- Summary of CPX transactions
SELECT 
    type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM transactions 
WHERE user_id = '13780936-1031-4c22-94a3-194205d7e0d1'
AND reference_id LIKE 'cpx_%'
GROUP BY type;

-- Check for any duplicate transactions
SELECT 
    reference_id,
    COUNT(*) as count
FROM transactions 
WHERE user_id = '13780936-1031-4c22-94a3-194205d7e0d1'
AND reference_id LIKE 'cpx_%'
GROUP BY reference_id
HAVING COUNT(*) > 1;

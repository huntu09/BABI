-- 🔍 INVESTIGASI ADMIN ADJUSTMENTS YANG GEDE
SELECT 
    t.id,
    t.user_id,
    t.amount,
    t.description,
    t.created_at,
    p.email,
    p.balance
FROM transactions t
JOIN profiles p ON t.user_id = p.id
WHERE t.type = 'admin_adjustment'
ORDER BY t.amount DESC;

-- Cek siapa yang punya balance gede
SELECT 
    email,
    balance,
    total_earned,
    created_at
FROM profiles 
WHERE balance > 1000
ORDER BY balance DESC;

-- Cek total platform liability
SELECT 
    SUM(balance) as total_user_balance,
    COUNT(*) as total_users,
    AVG(balance) as avg_balance,
    MAX(balance) as max_balance
FROM profiles;

-- Cek admin actions yang mencurigakan
SELECT 
    action_type,
    COUNT(*) as count,
    target_type
FROM admin_actions 
GROUP BY action_type, target_type
ORDER BY count DESC;

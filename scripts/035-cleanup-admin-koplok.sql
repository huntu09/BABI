-- 🧹 BERSIH-BERSIH ADMIN TESTING YANG KOPLOK

-- 1. Reset semua admin adjustment yang gede
DELETE FROM transactions 
WHERE type = 'admin_adjustment' 
AND amount > 1000;

-- 2. Reset balance semua user yang kegedean
UPDATE profiles 
SET balance = CASE 
    WHEN balance > 1000 THEN 100.00  -- Reset ke $100 aja
    ELSE balance 
END,
total_earned = CASE 
    WHEN total_earned > 1000 THEN 100.00
    ELSE total_earned 
END;

-- 3. Cancel withdrawal yang kegedean
UPDATE withdrawals 
SET status = 'cancelled'
WHERE amount > 500 
AND status = 'pending';

-- 4. Bersihkan admin actions yang aneh
DELETE FROM admin_actions 
WHERE details::text LIKE '%93%' 
OR details::text LIKE '%1000%';

-- 5. Reset fraud logs yang mungkin triggered
DELETE FROM fraud_logs 
WHERE confidence_score > 0.9;

-- 6. Cek hasil akhir
SELECT 
    'After Cleanup' as status,
    COUNT(*) as total_users,
    SUM(balance) as total_balance,
    AVG(balance) as avg_balance,
    MAX(balance) as max_balance
FROM profiles;

-- 7. Cek transaction yang tersisa
SELECT 
    type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM transactions 
GROUP BY type
ORDER BY total_amount DESC;

-- Fix unrealistic balances
-- Reset all balances over $100 to a reasonable amount

UPDATE profiles 
SET balance = 25.50 
WHERE balance > 100;

-- Log the balance reset
INSERT INTO transactions (user_id, type, amount, description, reference_type)
SELECT 
  id,
  'balance_reset',
  0,
  'Balance reset due to system bug - was over $100',
  'admin_action'
FROM profiles 
WHERE balance > 100;

-- Verify the changes
SELECT 
  email,
  balance,
  created_at
FROM profiles 
ORDER BY balance DESC
LIMIT 10;

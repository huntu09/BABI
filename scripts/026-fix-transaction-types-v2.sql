-- Check current constraints (PostgreSQL 12+ compatible)
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass 
AND contype = 'c'
AND conname LIKE '%type%';

-- Drop the restrictive constraint if it exists
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Also drop any other type-related constraints
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS check_transaction_type;

-- Add new flexible constraint that allows all offerwall types
ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN (
  'deposit',
  'withdrawal', 
  'bonus',
  'referral',
  'task_completion',
  'offerwall_completion',
  'offerwall_reversal',
  'admin_adjustment',
  'daily_bonus'
));

-- Check what transaction types currently exist in the table
SELECT DISTINCT type, COUNT(*) as count
FROM transactions 
GROUP BY type
ORDER BY count DESC;

-- Verify the new constraint is created
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass 
AND contype = 'c'
AND conname = 'transactions_type_check';

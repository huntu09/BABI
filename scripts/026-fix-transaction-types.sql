-- Check current constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass 
AND contype = 'c';

-- Drop the restrictive constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add new flexible constraint that allows offerwall types
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

-- Check what transaction types currently exist
SELECT DISTINCT type, COUNT(*) 
FROM transactions 
GROUP BY type;

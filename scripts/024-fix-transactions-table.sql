-- Fix transactions table - remove points column reference
-- Check current transactions table structure first
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- The transactions table should have these columns:
-- id, user_id, type, amount, description, reference_id, created_at

-- If there's a points column that shouldn't be there, remove it
ALTER TABLE transactions 
DROP COLUMN IF EXISTS points;

-- Make sure we have the right columns
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) NOT NULL DEFAULT 0.00;

-- Update any existing records that might have issues
UPDATE transactions 
SET amount = COALESCE(amount, 0.00) 
WHERE amount IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_type 
ON transactions(user_id, type);

CREATE INDEX IF NOT EXISTS idx_transactions_reference 
ON transactions(reference_id) 
WHERE reference_id IS NOT NULL;

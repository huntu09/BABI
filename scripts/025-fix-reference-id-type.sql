-- Fix reference_id column type from UUID to TEXT
ALTER TABLE transactions 
ALTER COLUMN reference_id TYPE TEXT;

-- Update constraint if exists
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_reference_id_check;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id 
ON transactions(reference_id) 
WHERE reference_id IS NOT NULL;

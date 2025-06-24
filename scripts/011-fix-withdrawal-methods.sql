-- Fix withdrawal methods constraint to match the actual payment methods used

-- Drop existing constraint
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_method_check;

-- Add new constraint with correct payment methods
ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_method_check 
CHECK (method IN ('dana', 'gopay', 'shopeepay', 'ovo', 'paypal', 'bank_transfer', 'crypto', 'gift_card'));

-- Update any existing records that might have different method names
UPDATE withdrawals 
SET method = CASE 
  WHEN method = 'DANA' THEN 'dana'
  WHEN method = 'GoPay' THEN 'gopay' 
  WHEN method = 'ShopeePay' THEN 'shopeepay'
  WHEN method = 'OVO' THEN 'ovo'
  ELSE LOWER(method)
END;

-- Verify the constraint
SELECT method, COUNT(*) 
FROM withdrawals 
GROUP BY method;

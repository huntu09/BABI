-- Fix offerwall_completions table schema issues
-- This script addresses critical field mismatches and constraints

-- Step 1: Add missing 'chargeback' status to constraint
ALTER TABLE public.offerwall_completions 
DROP CONSTRAINT IF EXISTS offerwall_completions_status_check;

ALTER TABLE public.offerwall_completions 
ADD CONSTRAINT offerwall_completions_status_check CHECK (
  status = ANY (ARRAY[
    'pending'::text,
    'completed'::text,
    'rejected'::text,
    'chargeback'::text
  ])
);

-- Step 2: Make user_id NOT NULL (optional - uncomment if needed)
-- UPDATE public.offerwall_completions SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
-- ALTER TABLE public.offerwall_completions ALTER COLUMN user_id SET NOT NULL;

-- Step 3: Add business validation constraints
ALTER TABLE public.offerwall_completions 
ADD CONSTRAINT offerwall_completions_reward_amount_positive 
CHECK (reward_amount > 0);

-- Step 4: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_offerwall_completions_provider_status 
ON public.offerwall_completions USING btree (provider, status);

CREATE INDEX IF NOT EXISTS idx_offerwall_completions_user_status 
ON public.offerwall_completions USING btree (user_id, status);

CREATE INDEX IF NOT EXISTS idx_offerwall_completions_external_offer 
ON public.offerwall_completions USING btree (external_offer_id);

CREATE INDEX IF NOT EXISTS idx_offerwall_completions_transaction 
ON public.offerwall_completions USING btree (transaction_id) 
WHERE transaction_id IS NOT NULL;

-- Step 5: Create analytics view for reporting
CREATE OR REPLACE VIEW offerwall_completion_stats AS
SELECT 
  provider,
  status,
  COUNT(*) as completion_count,
  SUM(reward_amount) as total_rewards,
  AVG(reward_amount) as avg_reward,
  MIN(completed_at) as first_completion,
  MAX(completed_at) as last_completion
FROM public.offerwall_completions
GROUP BY provider, status;

-- Step 6: Create user completion summary view
CREATE OR REPLACE VIEW user_offerwall_stats AS
SELECT 
  user_id,
  COUNT(*) as total_completions,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
  COUNT(CASE WHEN status = 'chargeback' THEN 1 END) as chargeback_count,
  SUM(CASE WHEN status = 'completed' THEN reward_amount ELSE 0 END) as total_earned,
  AVG(CASE WHEN status = 'completed' THEN reward_amount END) as avg_completion_reward
FROM public.offerwall_completions
GROUP BY user_id;

-- Step 7: Add completion validation function
CREATE OR REPLACE FUNCTION validate_offerwall_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure completed_at is set when status is completed
  IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- Ensure verified_at is set when status is completed
  IF NEW.status = 'completed' AND NEW.verified_at IS NULL THEN
    NEW.verified_at = NOW();
  END IF;
  
  -- Clear verified_at when status is not completed
  IF NEW.status != 'completed' THEN
    NEW.verified_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for validation
DROP TRIGGER IF EXISTS trigger_validate_offerwall_completion ON public.offerwall_completions;
CREATE TRIGGER trigger_validate_offerwall_completion
  BEFORE INSERT OR UPDATE ON public.offerwall_completions
  FOR EACH ROW
  EXECUTE FUNCTION validate_offerwall_completion();

-- Step 9: Add helpful comments
COMMENT ON TABLE public.offerwall_completions IS 'Tracks completed offers from various offerwall providers';
COMMENT ON COLUMN public.offerwall_completions.provider IS 'Offerwall provider name (cpx_research, adgem, etc.)';
COMMENT ON COLUMN public.offerwall_completions.external_offer_id IS 'Offer ID from the external provider';
COMMENT ON COLUMN public.offerwall_completions.transaction_id IS 'Provider transaction/reference ID';
COMMENT ON COLUMN public.offerwall_completions.reward_amount IS 'Points/credits earned from completion';
COMMENT ON COLUMN public.offerwall_completions.status IS 'Completion status: pending, completed, rejected, chargeback';
COMMENT ON COLUMN public.offerwall_completions.ip_address IS 'User IP address for fraud detection';
COMMENT ON COLUMN public.offerwall_completions.user_agent IS 'User browser agent for fraud detection';
COMMENT ON COLUMN public.offerwall_completions.completed_at IS 'When the offer was completed';
COMMENT ON COLUMN public.offerwall_completions.verified_at IS 'When the completion was verified';

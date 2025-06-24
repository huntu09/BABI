-- Check if offer_completions table exists and fix structure
DO $$
BEGIN
    -- Drop and recreate offer_completions table with correct structure
    DROP TABLE IF EXISTS offer_completions CASCADE;
    
    CREATE TABLE offer_completions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        external_offer_id TEXT NOT NULL,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        provider_id TEXT NOT NULL,
        transaction_id TEXT NOT NULL,
        points_earned INTEGER DEFAULT 0,
        payout_usd DECIMAL(10,2) DEFAULT 0,
        status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected', 'chargeback')),
        completed_at TIMESTAMPTZ DEFAULT NOW(),
        verified_at TIMESTAMPTZ,
        ip_address TEXT,
        user_agent TEXT,
        campaign_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_offer_completions_user_id ON offer_completions(user_id);
    CREATE INDEX IF NOT EXISTS idx_offer_completions_provider_id ON offer_completions(provider_id);
    CREATE INDEX IF NOT EXISTS idx_offer_completions_transaction_id ON offer_completions(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_offer_completions_status ON offer_completions(status);
    CREATE INDEX IF NOT EXISTS idx_offer_completions_completed_at ON offer_completions(completed_at);
    
    -- Create unique constraint to prevent duplicates
    CREATE UNIQUE INDEX IF NOT EXISTS idx_offer_completions_unique 
    ON offer_completions(transaction_id, user_id, provider_id);

    -- Enable RLS
    ALTER TABLE offer_completions ENABLE ROW LEVEL SECURITY;

    -- RLS Policies
    CREATE POLICY "Users can view their own completions" ON offer_completions
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Service role can manage all completions" ON offer_completions
        FOR ALL USING (auth.role() = 'service_role');

    -- Insert trigger for updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_offer_completions_updated_at 
        BEFORE UPDATE ON offer_completions 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE 'offer_completions table created successfully';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating offer_completions table: %', SQLERRM;
END $$;

-- Also ensure test user exists
INSERT INTO profiles (id, username, email, balance_usd, balance_points, created_at)
VALUES ('test_user_123', 'Test User', 'test@example.com', 0, 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'offer_completions' 
ORDER BY ordinal_position;

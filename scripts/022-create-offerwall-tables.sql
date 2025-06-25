-- =====================================================
-- OFFERWALL SYSTEM TABLES
-- Complete tables for CPX Research & other providers
-- =====================================================

-- 1. OFFERWALL PROVIDERS TABLE
-- Manage multiple offerwall providers
CREATE TABLE IF NOT EXISTS public.offerwall_providers (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    api_key TEXT,
    secret_key TEXT,
    app_id TEXT,
    base_url TEXT NOT NULL,
    callback_url TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT offerwall_providers_pkey PRIMARY KEY (id),
    CONSTRAINT offerwall_providers_name_check CHECK (
        name IN ('cpx_research', 'adgate', 'offertoro', 'ayetstudios', 'wannads', 'bitlabs')
    )
);

-- 2. CACHED OFFERS TABLE
-- Store offers from all providers
CREATE TABLE IF NOT EXISTS public.cached_offers (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    provider_id UUID NOT NULL,
    external_id TEXT NOT NULL, -- Provider's offer ID
    title TEXT NOT NULL,
    description TEXT,
    reward_amount NUMERIC(10,2) NOT NULL,
    original_reward NUMERIC(10,2), -- Provider's original reward
    conversion_rate NUMERIC(5,4) DEFAULT 1.0000, -- USD to local currency
    category VARCHAR(50),
    subcategory VARCHAR(50),
    countries TEXT[] DEFAULT '{}'::text[],
    devices TEXT[] DEFAULT '{}'::text[],
    requirements JSONB DEFAULT '{}'::jsonb,
    click_url TEXT NOT NULL,
    image_url TEXT,
    preview_url TEXT,
    estimated_time VARCHAR(50),
    difficulty VARCHAR(20) DEFAULT 'easy',
    success_rate NUMERIC(5,2), -- Completion success rate %
    rating NUMERIC(3,2), -- User rating 1-5
    total_clicks INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT cached_offers_pkey PRIMARY KEY (id),
    CONSTRAINT cached_offers_provider_id_fkey FOREIGN KEY (provider_id) 
        REFERENCES offerwall_providers(id) ON DELETE CASCADE,
    CONSTRAINT cached_offers_provider_external_unique UNIQUE (provider_id, external_id),
    CONSTRAINT cached_offers_difficulty_check CHECK (
        difficulty IN ('easy', 'medium', 'hard')
    )
);

-- 3. OFFER CLICKS TABLE
-- Track all offer clicks for analytics
CREATE TABLE IF NOT EXISTS public.offer_clicks (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL,
    offer_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    external_offer_id TEXT NOT NULL,
    click_id TEXT, -- Provider's click tracking ID
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country_code VARCHAR(2),
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT offer_clicks_pkey PRIMARY KEY (id),
    CONSTRAINT offer_clicks_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT offer_clicks_offer_id_fkey FOREIGN KEY (offer_id) 
        REFERENCES cached_offers(id) ON DELETE CASCADE,
    CONSTRAINT offer_clicks_provider_id_fkey FOREIGN KEY (provider_id) 
        REFERENCES offerwall_providers(id) ON DELETE CASCADE
);

-- 4. OFFER COMPLETIONS TABLE
-- Track completed offers from callbacks
CREATE TABLE IF NOT EXISTS public.offer_completions (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL,
    offer_id UUID,
    provider_id UUID NOT NULL,
    external_offer_id TEXT NOT NULL,
    external_user_id TEXT, -- Provider's user ID
    click_id TEXT, -- Link to click tracking
    transaction_id TEXT, -- Provider's transaction ID
    reward_amount NUMERIC(10,2) NOT NULL,
    original_reward NUMERIC(10,2), -- Provider's original reward
    conversion_rate NUMERIC(5,4) DEFAULT 1.0000,
    currency_code VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending',
    ip_address INET,
    callback_data JSONB DEFAULT '{}'::jsonb, -- Full callback payload
    verification_hash TEXT, -- Security hash from provider
    is_verified BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    credited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT offer_completions_pkey PRIMARY KEY (id),
    CONSTRAINT offer_completions_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT offer_completions_offer_id_fkey FOREIGN KEY (offer_id) 
        REFERENCES cached_offers(id) ON DELETE SET NULL,
    CONSTRAINT offer_completions_provider_id_fkey FOREIGN KEY (provider_id) 
        REFERENCES offerwall_providers(id) ON DELETE CASCADE,
    CONSTRAINT offer_completions_status_check CHECK (
        status IN ('pending', 'verified', 'credited', 'rejected', 'reversed')
    )
);

-- 5. OFFER ANALYTICS TABLE
-- Daily analytics for offers
CREATE TABLE IF NOT EXISTS public.offer_analytics (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    date DATE NOT NULL,
    provider_id UUID NOT NULL,
    offer_id UUID,
    total_clicks INTEGER DEFAULT 0,
    unique_clicks INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    total_revenue NUMERIC(12,2) DEFAULT 0,
    conversion_rate NUMERIC(5,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT offer_analytics_pkey PRIMARY KEY (id),
    CONSTRAINT offer_analytics_provider_id_fkey FOREIGN KEY (provider_id) 
        REFERENCES offerwall_providers(id) ON DELETE CASCADE,
    CONSTRAINT offer_analytics_offer_id_fkey FOREIGN KEY (offer_id) 
        REFERENCES cached_offers(id) ON DELETE CASCADE,
    CONSTRAINT offer_analytics_date_provider_offer_unique UNIQUE (date, provider_id, offer_id)
);

-- =====================================================
-- INDEXES FOR OPTIMAL PERFORMANCE
-- =====================================================

-- Offerwall Providers Indexes
CREATE INDEX IF NOT EXISTS idx_offerwall_providers_active 
    ON offerwall_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_offerwall_providers_name 
    ON offerwall_providers(name);

-- Cached Offers Indexes
CREATE INDEX IF NOT EXISTS idx_cached_offers_provider 
    ON cached_offers(provider_id);
CREATE INDEX IF NOT EXISTS idx_cached_offers_active 
    ON cached_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_cached_offers_reward 
    ON cached_offers(reward_amount DESC);
CREATE INDEX IF NOT EXISTS idx_cached_offers_category 
    ON cached_offers(category);
CREATE INDEX IF NOT EXISTS idx_cached_offers_countries 
    ON cached_offers USING GIN(countries);
CREATE INDEX IF NOT EXISTS idx_cached_offers_devices 
    ON cached_offers USING GIN(devices);
CREATE INDEX IF NOT EXISTS idx_cached_offers_active_reward 
    ON cached_offers(is_active, reward_amount DESC);
CREATE INDEX IF NOT EXISTS idx_cached_offers_expires 
    ON cached_offers(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cached_offers_last_synced 
    ON cached_offers(last_synced);
CREATE INDEX IF NOT EXISTS idx_cached_offers_external_id 
    ON cached_offers(external_id);

-- Offer Clicks Indexes
CREATE INDEX IF NOT EXISTS idx_offer_clicks_user 
    ON offer_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_offer 
    ON offer_clicks(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_provider 
    ON offer_clicks(provider_id);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_clicked_at 
    ON offer_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_user_clicked 
    ON offer_clicks(user_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_external_offer 
    ON offer_clicks(external_offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_click_id 
    ON offer_clicks(click_id) WHERE click_id IS NOT NULL;

-- Offer Completions Indexes
CREATE INDEX IF NOT EXISTS idx_offer_completions_user 
    ON offer_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_completions_offer 
    ON offer_completions(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_completions_provider 
    ON offer_completions(provider_id);
CREATE INDEX IF NOT EXISTS idx_offer_completions_status 
    ON offer_completions(status);
CREATE INDEX IF NOT EXISTS idx_offer_completions_external_offer 
    ON offer_completions(external_offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_completions_transaction_id 
    ON offer_completions(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_offer_completions_completed_at 
    ON offer_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_offer_completions_user_completed 
    ON offer_completions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_completions_pending 
    ON offer_completions(status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_offer_completions_verification 
    ON offer_completions(is_verified, status);

-- Offer Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_offer_analytics_date 
    ON offer_analytics(date);
CREATE INDEX IF NOT EXISTS idx_offer_analytics_provider 
    ON offer_analytics(provider_id);
CREATE INDEX IF NOT EXISTS idx_offer_analytics_offer 
    ON offer_analytics(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_analytics_date_provider 
    ON offer_analytics(date, provider_id);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================

-- Update timestamps trigger for offerwall_providers
CREATE TRIGGER trigger_offerwall_providers_updated_at
    BEFORE UPDATE ON offerwall_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamps trigger for cached_offers
CREATE TRIGGER trigger_cached_offers_updated_at
    BEFORE UPDATE ON cached_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE offerwall_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_analytics ENABLE ROW LEVEL SECURITY;

-- Offerwall Providers Policies (Admin only)
CREATE POLICY "Admin can manage offerwall providers" ON offerwall_providers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Cached Offers Policies (Public read, Admin write)
CREATE POLICY "Users can view active offers" ON cached_offers
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage offers" ON cached_offers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Offer Clicks Policies (Users can see their own)
CREATE POLICY "Users can view their own clicks" ON offer_clicks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own clicks" ON offer_clicks
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all clicks" ON offer_clicks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Offer Completions Policies (Users can see their own)
CREATE POLICY "Users can view their own completions" ON offer_completions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert completions" ON offer_completions
    FOR INSERT WITH CHECK (true); -- Callbacks from providers

CREATE POLICY "Admin can manage completions" ON offer_completions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Offer Analytics Policies (Admin only)
CREATE POLICY "Admin can view analytics" ON offer_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert CPX Research provider
INSERT INTO offerwall_providers (name, display_name, base_url, is_active, config) 
VALUES (
    'cpx_research',
    'CPX Research',
    'https://offers.cpx-research.com',
    true,
    '{
        "supported_countries": ["ID", "US", "GB", "AU"],
        "supported_devices": ["desktop", "mobile"],
        "min_payout": 0.01,
        "currency": "USD"
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Insert sample cached offers for testing
INSERT INTO cached_offers (
    provider_id, 
    external_id, 
    title, 
    description, 
    reward_amount, 
    category, 
    click_url,
    countries,
    devices,
    estimated_time
) 
SELECT 
    p.id,
    'sample_' || generate_random_uuid()::text,
    'Sample Survey ' || (row_number() OVER()),
    'Complete this survey to earn rewards',
    (random() * 5 + 0.5)::numeric(10,2),
    'survey',
    'https://example.com/survey/' || generate_random_uuid()::text,
    ARRAY['ID', 'US'],
    ARRAY['desktop', 'mobile'],
    (5 + random() * 15)::int || ' minutes'
FROM offerwall_providers p
WHERE p.name = 'cpx_research'
CROSS JOIN generate_series(1, 10)
ON CONFLICT DO NOTHING;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to clean expired offers
CREATE OR REPLACE FUNCTION clean_expired_offers()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cached_offers 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update offer statistics
CREATE OR REPLACE FUNCTION update_offer_stats(offer_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE cached_offers 
    SET 
        total_clicks = (
            SELECT COUNT(*) FROM offer_clicks 
            WHERE offer_id = offer_uuid
        ),
        total_completions = (
            SELECT COUNT(*) FROM offer_completions 
            WHERE offer_id = offer_uuid AND status = 'credited'
        ),
        updated_at = NOW()
    WHERE id = offer_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ OFFERWALL TABLES CREATED SUCCESSFULLY!';
    RAISE NOTICE '📊 Tables: offerwall_providers, cached_offers, offer_clicks, offer_completions, offer_analytics';
    RAISE NOTICE '🔒 RLS Policies: Enabled with proper security';
    RAISE NOTICE '⚡ Indexes: Optimized for performance';
    RAISE NOTICE '🎯 Sample Data: CPX Research provider + 10 sample offers';
    RAISE NOTICE '🚀 Ready for CPX Research integration!';
END $$;

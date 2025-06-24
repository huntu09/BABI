-- =====================================================
-- MISSING OFFERWALL TABLES
-- Melengkapi sistem offerwall dengan cached_offers dan offer_clicks
-- =====================================================

-- 1. CACHED OFFERS TABLE
-- Menyimpan offers dari providers untuk performance
CREATE TABLE public.cached_offers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    external_offer_id text NOT NULL,
    title text NOT NULL,
    description text,
    reward_amount numeric(10,2) NOT NULL,
    original_reward numeric(10,2) NOT NULL, -- Original reward dari provider
    conversion_rate numeric(5,4) DEFAULT 1.0000, -- Untuk currency conversion
    category text,
    subcategory text,
    requirements jsonb DEFAULT '{}'::jsonb,
    
    -- Targeting & Filtering
    countries text[] DEFAULT '{}'::text[],
    devices text[] DEFAULT '{}'::text[],
    os_versions text[] DEFAULT '{}'::text[],
    min_age integer,
    max_age integer,
    gender text, -- 'male', 'female', 'all'
    
    -- URLs & Media
    offer_url text NOT NULL,
    image_url text,
    icon_url text,
    preview_url text,
    
    -- Tracking & Analytics
    clicks_count integer DEFAULT 0,
    completions_count integer DEFAULT 0,
    conversion_rate_percent numeric(5,2) DEFAULT 0.00,
    
    -- Status & Timing
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    priority_score integer DEFAULT 0,
    estimated_time text, -- "5 minutes", "1 hour", etc
    difficulty text DEFAULT 'easy', -- easy, medium, hard
    
    -- Provider specific data
    provider_data jsonb DEFAULT '{}'::jsonb,
    tracking_params jsonb DEFAULT '{}'::jsonb,
    
    -- Expiry & Limits
    expires_at timestamp with time zone,
    daily_cap integer,
    total_cap integer,
    user_limit integer DEFAULT 1, -- How many times user can complete
    
    -- Timestamps
    last_synced_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT cached_offers_pkey PRIMARY KEY (id),
    CONSTRAINT cached_offers_provider_external_id_key UNIQUE (provider, external_offer_id),
    CONSTRAINT cached_offers_provider_check CHECK (
        provider = ANY(ARRAY[
            'cpx_research'::text,
            'adgem'::text, 
            'lootably'::text,
            'offertoro'::text,
            'bitlabs'::text,
            'ayetstudios'::text,
            'revenue_universe'::text,
            'persona_ly'::text
        ])
    ),
    CONSTRAINT cached_offers_gender_check CHECK (
        gender IS NULL OR gender = ANY(ARRAY['male'::text, 'female'::text, 'all'::text])
    ),
    CONSTRAINT cached_offers_difficulty_check CHECK (
        difficulty = ANY(ARRAY['easy'::text, 'medium'::text, 'hard'::text])
    )
);

-- 2. OFFER CLICKS TABLE  
-- Track semua klik offers untuk analytics dan fraud detection
CREATE TABLE public.offer_clicks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    offer_id uuid NOT NULL, -- Reference ke cached_offers
    provider text NOT NULL,
    external_offer_id text NOT NULL,
    
    -- Click Details
    clicked_at timestamp with time zone DEFAULT now(),
    click_source text DEFAULT 'offerwall', -- offerwall, featured, search, etc
    
    -- User Context
    ip_address inet,
    user_agent text,
    device_type text, -- mobile, desktop, tablet
    browser text,
    os text,
    country text,
    
    -- Tracking & Attribution
    session_id text,
    referrer text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    
    -- Status & Completion
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    completion_id uuid, -- Reference ke offerwall_completions
    
    -- Fraud Detection
    is_suspicious boolean DEFAULT false,
    fraud_score numeric(3,2) DEFAULT 0.00,
    fraud_reasons text[],
    
    -- Provider Response
    redirect_url text,
    tracking_id text, -- Provider's tracking ID
    provider_response jsonb,
    
    CONSTRAINT offer_clicks_pkey PRIMARY KEY (id),
    CONSTRAINT offer_clicks_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT offer_clicks_offer_id_fkey FOREIGN KEY (offer_id) 
        REFERENCES cached_offers(id) ON DELETE CASCADE,
    CONSTRAINT offer_clicks_completion_id_fkey FOREIGN KEY (completion_id) 
        REFERENCES offerwall_completions(id) ON DELETE SET NULL,
    CONSTRAINT offer_clicks_provider_check CHECK (
        provider = ANY(ARRAY[
            'cpx_research'::text,
            'adgem'::text,
            'lootably'::text, 
            'offertoro'::text,
            'bitlabs'::text,
            'ayetstudios'::text,
            'revenue_universe'::text,
            'persona_ly'::text
        ])
    )
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- CACHED OFFERS INDEXES
CREATE INDEX idx_cached_offers_provider ON cached_offers(provider);
CREATE INDEX idx_cached_offers_active ON cached_offers(is_active) WHERE is_active = true;
CREATE INDEX idx_cached_offers_featured ON cached_offers(is_featured) WHERE is_featured = true;
CREATE INDEX idx_cached_offers_category ON cached_offers(category);
CREATE INDEX idx_cached_offers_reward ON cached_offers(reward_amount DESC);
CREATE INDEX idx_cached_offers_priority ON cached_offers(priority_score DESC);
CREATE INDEX idx_cached_offers_expires ON cached_offers(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_cached_offers_countries ON cached_offers USING GIN(countries);
CREATE INDEX idx_cached_offers_devices ON cached_offers USING GIN(devices);
CREATE INDEX idx_cached_offers_active_provider ON cached_offers(is_active, provider);
CREATE INDEX idx_cached_offers_active_reward ON cached_offers(is_active, reward_amount DESC);
CREATE INDEX idx_cached_offers_sync_time ON cached_offers(last_synced_at);

-- OFFER CLICKS INDEXES  
CREATE INDEX idx_offer_clicks_user_id ON offer_clicks(user_id);
CREATE INDEX idx_offer_clicks_offer_id ON offer_clicks(offer_id);
CREATE INDEX idx_offer_clicks_provider ON offer_clicks(provider);
CREATE INDEX idx_offer_clicks_clicked_at ON offer_clicks(clicked_at);
CREATE INDEX idx_offer_clicks_completed ON offer_clicks(completed);
CREATE INDEX idx_offer_clicks_suspicious ON offer_clicks(is_suspicious) WHERE is_suspicious = true;
CREATE INDEX idx_offer_clicks_user_clicked ON offer_clicks(user_id, clicked_at DESC);
CREATE INDEX idx_offer_clicks_offer_clicked ON offer_clicks(offer_id, clicked_at DESC);
CREATE INDEX idx_offer_clicks_provider_clicked ON offer_clicks(provider, clicked_at DESC);
CREATE INDEX idx_offer_clicks_completion ON offer_clicks(completion_id) WHERE completion_id IS NOT NULL;
CREATE INDEX idx_offer_clicks_session ON offer_clicks(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_offer_clicks_ip_suspicious ON offer_clicks(ip_address, is_suspicious);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE
-- =====================================================

-- Auto update timestamps
CREATE OR REPLACE FUNCTION update_cached_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cached_offers_updated_at
    BEFORE UPDATE ON cached_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_cached_offers_updated_at();

-- Auto update offer stats when clicked
CREATE OR REPLACE FUNCTION update_offer_click_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update clicks count in cached_offers
    UPDATE cached_offers 
    SET clicks_count = clicks_count + 1,
        updated_at = now()
    WHERE id = NEW.offer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_offer_click_stats
    AFTER INSERT ON offer_clicks
    FOR EACH ROW
    EXECUTE FUNCTION update_offer_click_stats();

-- Auto update completion stats
CREATE OR REPLACE FUNCTION update_offer_completion_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
        -- Update completion count and conversion rate
        UPDATE cached_offers 
        SET completions_count = completions_count + 1,
            conversion_rate_percent = CASE 
                WHEN clicks_count > 0 THEN 
                    ROUND(((completions_count + 1)::numeric / clicks_count::numeric) * 100, 2)
                ELSE 0.00
            END,
            updated_at = now()
        WHERE id = NEW.offer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_offer_completion_stats
    AFTER UPDATE ON offer_clicks
    FOR EACH ROW
    EXECUTE FUNCTION update_offer_completion_stats();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE cached_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_clicks ENABLE ROW LEVEL SECURITY;

-- Cached offers policies (public read for active offers)
CREATE POLICY "Public can view active offers" ON cached_offers
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all offers" ON cached_offers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Offer clicks policies (users can only see their own clicks)
CREATE POLICY "Users can view own clicks" ON offer_clicks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own clicks" ON offer_clicks
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own clicks" ON offer_clicks
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all clicks" ON offer_clicks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample CPX Research offers
INSERT INTO cached_offers (
    provider, external_offer_id, title, description, reward_amount, original_reward,
    category, offer_url, image_url, countries, devices, estimated_time, difficulty
) VALUES 
(
    'cpx_research', 'CPX_001', 'Complete Survey about Shopping Habits',
    'Share your shopping preferences and earn rewards', 2.50, 2.50,
    'survey', 'https://cpx-research.com/offer/CPX_001', 
    '/placeholder.svg?height=100&width=100',
    ARRAY['US', 'CA', 'GB', 'AU'], ARRAY['mobile', 'desktop'],
    '10 minutes', 'easy'
),
(
    'cpx_research', 'CPX_002', 'Download and Try Mobile Game',
    'Download game, reach level 5 and earn coins', 5.00, 5.00,
    'app_install', 'https://cpx-research.com/offer/CPX_002',
    '/placeholder.svg?height=100&width=100', 
    ARRAY['US', 'CA'], ARRAY['mobile'],
    '30 minutes', 'medium'
),
(
    'cpx_research', 'CPX_003', 'Sign up for Newsletter',
    'Subscribe to newsletter and confirm email', 1.00, 1.00,
    'signup', 'https://cpx-research.com/offer/CPX_003',
    '/placeholder.svg?height=100&width=100',
    ARRAY['US', 'CA', 'GB', 'AU', 'ID'], ARRAY['mobile', 'desktop'],
    '5 minutes', 'easy'
);

-- Insert sample AdGem offers
INSERT INTO cached_offers (
    provider, external_offer_id, title, description, reward_amount, original_reward,
    category, offer_url, image_url, countries, devices, estimated_time, difficulty
) VALUES 
(
    'adgem', 'ADGEM_001', 'Watch Video Advertisement',
    'Watch 30-second video ad and earn points', 0.25, 0.25,
    'video', 'https://adgem.com/offer/ADGEM_001',
    '/placeholder.svg?height=100&width=100',
    ARRAY['US', 'CA', 'GB'], ARRAY['mobile', 'desktop'],
    '1 minute', 'easy'
),
(
    'adgem', 'ADGEM_002', 'Complete Registration Form',
    'Fill out registration form for rewards program', 3.00, 3.00,
    'signup', 'https://adgem.com/offer/ADGEM_002',
    '/placeholder.svg?height=100&width=100',
    ARRAY['US', 'CA'], ARRAY['desktop'],
    '15 minutes', 'medium'
);

COMMENT ON TABLE cached_offers IS 'Stores offers from offerwall providers for better performance';
COMMENT ON TABLE offer_clicks IS 'Tracks user clicks on offers for analytics and fraud detection';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Missing offerwall tables created successfully!';
    RAISE NOTICE '📊 cached_offers: % rows inserted', (SELECT COUNT(*) FROM cached_offers);
    RAISE NOTICE '🔗 offer_clicks: Ready for tracking';
    RAISE NOTICE '🚀 Offerwall system is now 100%% complete!';
END $$;

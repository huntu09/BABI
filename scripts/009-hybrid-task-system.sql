-- 🔄 HYBRID TASK SYSTEM - PHASE 2
-- Add columns and tables for hybrid sample + real offerwall system

-- Add task source tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_source VARCHAR(20) DEFAULT 'sample';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS external_offer_id VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS provider_config JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS callback_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_tracking JSONB DEFAULT '{}';

-- Update existing sample tasks to mark as sample
UPDATE tasks SET task_source = 'sample' WHERE task_source IS NULL;

-- Add offerwall provider tracking
CREATE TABLE IF NOT EXISTS offerwall_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id VARCHAR(50) UNIQUE NOT NULL,
    provider_name VARCHAR(100) NOT NULL,
    api_endpoint TEXT NOT NULL,
    api_key_encrypted TEXT,
    secret_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add real offer completions tracking
CREATE TABLE IF NOT EXISTS real_offer_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    provider_id VARCHAR(50) NOT NULL,
    external_offer_id VARCHAR(100) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    offer_title TEXT,
    points_earned INTEGER NOT NULL,
    payout_usd DECIMAL(10,4),
    status VARCHAR(20) DEFAULT 'pending',
    callback_data JSONB,
    ip_address INET,
    user_agent TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, external_offer_id, user_id)
);

-- Add task recommendation system
CREATE TABLE IF NOT EXISTS user_task_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    preferred_categories TEXT[] DEFAULT '{}',
    preferred_difficulty VARCHAR(20) DEFAULT 'easy',
    preferred_time_range VARCHAR(20) DEFAULT 'short',
    min_payout DECIMAL(10,2) DEFAULT 0.25,
    max_payout DECIMAL(10,2) DEFAULT 5.00,
    prefers_real_offers BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Insert CPX Research provider
INSERT INTO offerwall_providers (provider_id, provider_name, api_endpoint, is_active, config) 
VALUES (
    'cpx_research',
    'CPX Research',
    'https://offers.cpx-research.com/api/v1',
    true,
    '{
        "supported_countries": ["US", "GB", "CA", "AU", "DE"],
        "supported_devices": ["mobile", "desktop"],
        "categories": ["survey", "poll", "questionnaire"],
        "min_payout": 0.25,
        "max_payout": 5.00,
        "conversion_rate": 1000,
        "callback_required": true
    }'::jsonb
) ON CONFLICT (provider_id) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(task_source);
CREATE INDEX IF NOT EXISTS idx_tasks_external_id ON tasks(external_offer_id);
CREATE INDEX IF NOT EXISTS idx_real_completions_user ON real_offer_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_real_completions_provider ON real_offer_completions(provider_id);
CREATE INDEX IF NOT EXISTS idx_real_completions_status ON real_offer_completions(status);

-- Add RLS policies
ALTER TABLE offerwall_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_offer_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for offerwall_providers (admin only)
CREATE POLICY "Admin can manage offerwall providers" ON offerwall_providers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Policies for real_offer_completions
CREATE POLICY "Users can view own completions" ON real_offer_completions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert completions" ON real_offer_completions
    FOR INSERT WITH CHECK (true);

-- Policies for user_task_preferences
CREATE POLICY "Users can manage own preferences" ON user_task_preferences
    FOR ALL USING (user_id = auth.uid());

-- Function to get hybrid task recommendations
CREATE OR REPLACE FUNCTION get_hybrid_task_recommendations(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    task_id UUID,
    title TEXT,
    description TEXT,
    reward_amount DECIMAL(10,2),
    task_type TEXT,
    task_source VARCHAR(20),
    provider TEXT,
    difficulty VARCHAR(20),
    estimated_time TEXT,
    is_completed BOOLEAN,
    recommendation_score INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_prefs RECORD;
    user_level INTEGER;
BEGIN
    -- Get user preferences and level
    SELECT 
        COALESCE(utp.preferred_categories, ARRAY['survey', 'gaming', 'app']::TEXT[]) as preferred_categories,
        COALESCE(utp.preferred_difficulty, 'easy') as preferred_difficulty,
        COALESCE(utp.prefers_real_offers, false) as prefers_real_offers,
        COALESCE(utp.min_payout, 0.25) as min_payout,
        COALESCE(utp.max_payout, 5.00) as max_payout,
        COALESCE(p.level, 1) as user_level
    INTO user_prefs
    FROM profiles p
    LEFT JOIN user_task_preferences utp ON utp.user_id = p.id
    WHERE p.id = p_user_id;

    RETURN QUERY
    WITH task_scores AS (
        SELECT 
            t.id as task_id,
            t.title,
            t.description,
            t.reward_amount,
            t.task_type,
            t.task_source,
            t.provider,
            COALESCE(t.difficulty, 'easy') as difficulty,
            COALESCE(t.estimated_time, '10 minutes') as estimated_time,
            EXISTS(
                SELECT 1 FROM user_tasks ut 
                WHERE ut.user_id = p_user_id 
                AND ut.task_id = t.id 
                AND ut.status = 'completed'
            ) as is_completed,
            -- Scoring algorithm
            (
                CASE 
                    -- Prefer user's preferred categories
                    WHEN t.task_type = ANY(user_prefs.preferred_categories) THEN 20
                    ELSE 0
                END +
                CASE 
                    -- Prefer user's preferred difficulty
                    WHEN COALESCE(t.difficulty, 'easy') = user_prefs.preferred_difficulty THEN 15
                    ELSE 0
                END +
                CASE 
                    -- Prefer real offers if user wants them
                    WHEN user_prefs.prefers_real_offers AND t.task_source = 'offerwall' THEN 25
                    WHEN NOT user_prefs.prefers_real_offers AND t.task_source = 'sample' THEN 15
                    ELSE 5
                END +
                CASE 
                    -- Reward amount preference
                    WHEN t.reward_amount BETWEEN user_prefs.min_payout AND user_prefs.max_payout THEN 10
                    ELSE 0
                END +
                -- Random factor for variety
                (RANDOM() * 10)::INTEGER
            )::INTEGER as recommendation_score
        FROM tasks t
        WHERE t.is_active = true
        AND NOT EXISTS(
            SELECT 1 FROM user_tasks ut 
            WHERE ut.user_id = p_user_id 
            AND ut.task_id = t.id 
            AND ut.status = 'completed'
        )
    )
    SELECT 
        ts.task_id,
        ts.title,
        ts.description,
        ts.reward_amount,
        ts.task_type,
        ts.task_source,
        ts.provider,
        ts.difficulty,
        ts.estimated_time,
        ts.is_completed,
        ts.recommendation_score
    FROM task_scores ts
    ORDER BY ts.recommendation_score DESC, ts.reward_amount DESC
    LIMIT p_limit;
END;
$$;

-- Function to handle real offer completion
CREATE OR REPLACE FUNCTION handle_real_offer_completion(
    p_user_id UUID,
    p_provider_id VARCHAR(50),
    p_external_offer_id VARCHAR(100),
    p_transaction_id VARCHAR(100),
    p_offer_title TEXT,
    p_points_earned INTEGER,
    p_payout_usd DECIMAL(10,4),
    p_callback_data JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    completion_id UUID;
    user_profile RECORD;
    fraud_score DECIMAL(3,2);
    result JSONB;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile FROM profiles WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    -- Check for duplicate completion
    IF EXISTS(
        SELECT 1 FROM real_offer_completions 
        WHERE user_id = p_user_id 
        AND provider_id = p_provider_id 
        AND external_offer_id = p_external_offer_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Offer already completed');
    END IF;

    -- Basic fraud detection
    fraud_score := 0.0;
    
    -- Check completion frequency (more than 10 in last hour = suspicious)
    IF (
        SELECT COUNT(*) FROM real_offer_completions 
        WHERE user_id = p_user_id 
        AND completed_at > NOW() - INTERVAL '1 hour'
    ) > 10 THEN
        fraud_score := fraud_score + 0.3;
    END IF;

    -- Check if payout is unusually high
    IF p_payout_usd > 10.00 THEN
        fraud_score := fraud_score + 0.2;
    END IF;

    -- Insert completion record
    INSERT INTO real_offer_completions (
        user_id, provider_id, external_offer_id, transaction_id,
        offer_title, points_earned, payout_usd, callback_data,
        ip_address, user_agent, status
    ) VALUES (
        p_user_id, p_provider_id, p_external_offer_id, p_transaction_id,
        p_offer_title, p_points_earned, p_payout_usd, p_callback_data,
        p_ip_address, p_user_agent,
        CASE WHEN fraud_score > 0.5 THEN 'pending_review' ELSE 'completed' END
    ) RETURNING id INTO completion_id;

    -- Credit points if not flagged for review
    IF fraud_score <= 0.5 THEN
        UPDATE profiles 
        SET balance = balance + p_points_earned,
            total_earned = total_earned + p_points_earned,
            updated_at = NOW()
        WHERE id = p_user_id;

        -- Log transaction
        INSERT INTO transactions (user_id, type, amount, description, status)
        VALUES (
            p_user_id, 'earn', p_points_earned,
            'Completed offer: ' || p_offer_title || ' (' || p_provider_id || ')',
            'completed'
        );

        result := jsonb_build_object(
            'success', true,
            'completion_id', completion_id,
            'points_earned', p_points_earned,
            'status', 'completed',
            'fraud_score', fraud_score
        );
    ELSE
        result := jsonb_build_object(
            'success', true,
            'completion_id', completion_id,
            'points_earned', 0,
            'status', 'pending_review',
            'fraud_score', fraud_score,
            'message', 'Completion is under review'
        );
    END IF;

    RETURN result;
END;
$$;

-- Add some sample real offers from CPX Research (for testing)
INSERT INTO tasks (
    title, description, reward_amount, task_type, provider, 
    difficulty, estimated_time, countries, devices, requirements, 
    is_active, url, task_source, external_offer_id, provider_config
) VALUES 
(
    'CPX Research Survey - Consumer Habits',
    'Share your opinion about shopping habits and consumer preferences. Quick 5-minute survey.',
    0.75, 'survey', 'CPX Research',
    'easy', '5 minutes', 
    ARRAY['US', 'GB', 'CA'], ARRAY['mobile', 'desktop'], ARRAY['Age 18+'],
    true, 'https://offers.cpx-research.com/survey/123',
    'offerwall', 'cpx_survey_123',
    '{"provider_id": "cpx_research", "survey_id": "123", "loi": 5}'::jsonb
),
(
    'CPX Research Survey - Technology Usage',
    'Tell us about your technology usage patterns. Earn points for your valuable insights.',
    1.25, 'survey', 'CPX Research',
    'medium', '8 minutes',
    ARRAY['US', 'GB', 'CA', 'AU'], ARRAY['mobile', 'desktop'], ARRAY['Age 18+', 'Tech user'],
    true, 'https://offers.cpx-research.com/survey/456',
    'offerwall', 'cpx_survey_456',
    '{"provider_id": "cpx_research", "survey_id": "456", "loi": 8}'::jsonb
),
(
    'CPX Research Survey - Health & Wellness',
    'Share your thoughts on health and wellness topics. High-paying survey opportunity.',
    2.00, 'survey', 'CPX Research',
    'medium', '12 minutes',
    ARRAY['US', 'GB'], ARRAY['mobile', 'desktop'], ARRAY['Age 21+', 'Health conscious'],
    true, 'https://offers.cpx-research.com/survey/789',
    'offerwall', 'cpx_survey_789',
    '{"provider_id": "cpx_research", "survey_id": "789", "loi": 12}'::jsonb
) ON CONFLICT DO NOTHING;

COMMIT;

-- 🛡️ PRODUCTION SECURITY TABLES

-- Advanced fraud detection logs
CREATE TABLE IF NOT EXISTS advanced_fraud_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    fraud_score DECIMAL(3,2) NOT NULL,
    checks JSONB NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User device tracking
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_info JSONB,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_trusted BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, device_fingerprint)
);

-- User location tracking
CREATE TABLE IF NOT EXISTS user_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    country TEXT,
    city TEXT,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security incidents
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    incident_type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    details JSONB,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    assigned_to UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- API rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP or user_id
    endpoint TEXT NOT NULL,
    requests_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    UNIQUE(identifier, endpoint)
);

-- System health monitoring
CREATE TABLE IF NOT EXISTS system_health (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,4),
    tags JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_advanced_fraud_logs_user_id ON advanced_fraud_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_advanced_fraud_logs_created_at ON advanced_fraud_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_advanced_fraud_logs_risk_level ON advanced_fraud_logs(risk_level);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON user_devices(device_fingerprint);

CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_created_at ON user_locations(created_at);

CREATE INDEX IF NOT EXISTS idx_security_incidents_user_id ON security_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);

-- Enable RLS
ALTER TABLE advanced_fraud_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only access for security tables)
CREATE POLICY "Admin can view all fraud logs" ON advanced_fraud_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can view all security incidents" ON security_incidents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Users can only see their own device/location data
CREATE POLICY "Users can view own devices" ON user_devices
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own locations" ON user_locations
    FOR SELECT USING (user_id = auth.uid());

-- System can insert data
CREATE POLICY "System can insert fraud logs" ON advanced_fraud_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can manage devices" ON user_devices
    FOR ALL WITH CHECK (true);

CREATE POLICY "System can manage locations" ON user_locations
    FOR ALL WITH CHECK (true);

CREATE POLICY "System can manage incidents" ON security_incidents
    FOR ALL WITH CHECK (true);

CREATE POLICY "System can manage rate limits" ON rate_limits
    FOR ALL WITH CHECK (true);

CREATE POLICY "System can manage health metrics" ON system_health
    FOR ALL WITH CHECK (true);

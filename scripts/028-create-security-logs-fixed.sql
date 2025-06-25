-- Create security logs table for monitoring hack attempts
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_logs_type ON security_logs(type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip_address);

-- Enable RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs (using is_admin column)
CREATE POLICY "Admin can view security logs" ON security_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Allow system to insert security logs (for callback logging)
CREATE POLICY "System can insert security logs" ON security_logs
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON security_logs TO authenticated;
GRANT INSERT ON security_logs TO authenticated;
GRANT SELECT ON security_logs TO anon;
GRANT INSERT ON security_logs TO anon;

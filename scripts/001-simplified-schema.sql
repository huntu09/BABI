-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  email_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  login_streak INTEGER DEFAULT 0,
  suspicious_activity_count INTEGER DEFAULT 0,
  email_verified_at TIMESTAMP WITH TIME ZONE
);

-- Create tasks table for earning opportunities
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reward_amount DECIMAL(10,2) NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('survey', 'offer', 'video', 'app_install', 'signup')),
  provider TEXT,
  external_id TEXT,
  requirements JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  daily_limit INTEGER,
  total_limit INTEGER,
  completion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  countries TEXT[] DEFAULT '{}',
  devices TEXT[] DEFAULT '{}',
  url TEXT,
  image_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create user_tasks table to track task completions
CREATE TABLE IF NOT EXISTS user_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  reward_earned DECIMAL(10,2),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('paypal', 'bank_transfer', 'crypto', 'gift_card')),
  account_details JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bonus_earned DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create badges table for gamification
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('tasks_completed', 'amount_earned', 'referrals_made', 'days_active')),
  requirement_value INTEGER NOT NULL,
  reward_amount DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Create transactions table for audit trail
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'withdraw', 'bonus', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID, -- Can reference task_id, withdrawal_id, etc.
  reference_type TEXT, -- 'task', 'withdrawal', 'referral', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fraud_logs table for security tracking
CREATE TABLE IF NOT EXISTS fraud_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('vpn_detected', 'multiple_accounts', 'suspicious_referral', 'rapid_completion', 'invalid_location')),
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_levels table for gamification
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offerwall_completions table for tracking external offers
CREATE TABLE IF NOT EXISTS offerwall_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('cpx_research', 'adgem', 'lootably', 'offertoro', 'bitlabs', 'ayetstudios', 'revenue_universe', 'persona_ly')),
  external_offer_id TEXT NOT NULL,
  transaction_id TEXT,
  reward_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  ip_address INET,
  user_agent TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, provider, external_offer_id)
);

-- Create push_subscriptions table for notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Create system_settings table for admin configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_bonuses table for tracking login bonuses
CREATE TABLE IF NOT EXISTS daily_bonuses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bonus_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  streak_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bonus_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_user_id ON fraud_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_risk_level ON fraud_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_offerwall_completions_user_id ON offerwall_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_offerwall_completions_status ON offerwall_completions(status);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_bonuses_user_id ON daily_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_bonuses_date ON daily_bonuses(bonus_date);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE offerwall_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_bonuses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- User tasks: Users can view/insert their own tasks
CREATE POLICY "Users can view own tasks" ON user_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON user_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Withdrawals: Users can view/insert their own withdrawals
CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals: Users can view referrals they made or were referred by
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Notifications: Users can view/update their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- User badges: Users can view their own badges
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- Transactions: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Public read access for tasks and badges
CREATE POLICY "Anyone can view active tasks" ON tasks FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active badges" ON badges FOR SELECT USING (is_active = true);

-- Create RLS policies for new tables
CREATE POLICY "Users can view own fraud logs" ON fraud_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own level" ON user_levels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own offerwall completions" ON offerwall_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own daily bonuses" ON daily_bonuses FOR SELECT USING (auth.uid() = user_id);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_user_balance(user_uuid UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET balance = balance + amount,
      total_earned = CASE WHEN amount > 0 THEN total_earned + amount ELSE total_earned END,
      updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO exists;
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code on profile creation
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('min_withdrawal_amount', '200', 'Minimum withdrawal amount in points'),
('max_withdrawal_amount', '100000', 'Maximum withdrawal amount in points'),
('referral_commission_rate', '0.10', 'Referral commission rate (10%)'),
('daily_login_bonus', '25', 'Daily login bonus points'),
('fraud_score_threshold', '{"block": 0.8, "flag": 0.6, "warn": 0.4}', 'Fraud detection thresholds'),
('withdrawal_processing_fee', '0', 'Withdrawal processing fee percentage'),
('platform_status', '"active"', 'Platform operational status')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default badges
INSERT INTO badges (name, description, icon, requirement_type, requirement_value, reward_amount) VALUES
('First Steps', 'Complete your first task', '🎯', 'tasks_completed', 1, 50.00),
('Getting Started', 'Complete 10 tasks', '⭐', 'tasks_completed', 10, 100.00),
('Task Master', 'Complete 50 tasks', '🏆', 'tasks_completed', 50, 500.00),
('High Earner', 'Earn $10 total', '💰', 'amount_earned', 1000, 200.00),
('Referral King', 'Refer 5 friends', '👑', 'referrals_made', 5, 300.00),
('Loyal User', 'Active for 30 days', '🔥', 'days_active', 30, 250.00)
ON CONFLICT (name) DO NOTHING;

-- Function to update user XP and level
CREATE OR REPLACE FUNCTION update_user_xp(user_uuid UUID, xp_amount INTEGER)
RETURNS VOID AS $$
DECLARE
  current_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Insert or update user level record
  INSERT INTO user_levels (user_id, current_xp, total_xp)
  VALUES (user_uuid, xp_amount, xp_amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    current_xp = user_levels.current_xp + xp_amount,
    total_xp = user_levels.total_xp + xp_amount,
    updated_at = NOW();
  
  -- Calculate new level based on XP
  SELECT total_xp INTO current_xp FROM user_levels WHERE user_id = user_uuid;
  new_level := LEAST(FLOOR(current_xp / 100) + 1, 10); -- Max level 10
  
  -- Update level if changed
  UPDATE user_levels 
  SET current_level = new_level 
  WHERE user_id = user_uuid AND current_level != new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_user_badges(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  badge_record RECORD;
  user_stat INTEGER;
BEGIN
  FOR badge_record IN SELECT * FROM badges WHERE is_active = true LOOP
    -- Skip if user already has this badge
    IF EXISTS(SELECT 1 FROM user_badges WHERE user_id = user_uuid AND badge_id = badge_record.id) THEN
      CONTINUE;
    END IF;
    
    -- Check badge requirements
    CASE badge_record.requirement_type
      WHEN 'tasks_completed' THEN
        SELECT COUNT(*) INTO user_stat FROM user_tasks WHERE user_id = user_uuid AND status = 'completed';
      WHEN 'amount_earned' THEN
        SELECT COALESCE(total_earned * 100, 0)::INTEGER INTO user_stat FROM profiles WHERE id = user_uuid;
      WHEN 'referrals_made' THEN
        SELECT COUNT(*) INTO user_stat FROM referrals WHERE referrer_id = user_uuid;
      WHEN 'days_active' THEN
        SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER INTO user_stat FROM profiles WHERE id = user_uuid;
    END CASE;
    
    -- Award badge if requirement met
    IF user_stat >= badge_record.requirement_value THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (user_uuid, badge_record.id);
      -- Award bonus points
      PERFORM update_user_balance(user_uuid, badge_record.reward_amount);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

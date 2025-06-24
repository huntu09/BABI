-- Add sample data for testing all features

-- Insert sample tasks/offers
INSERT INTO tasks (title, description, points, category, provider, difficulty, estimated_time, countries, devices, requirements, is_active) VALUES
('Complete Survey - Shopping Habits', 'Answer questions about your shopping preferences and earn points', 50, 'survey', 'CPX Research', 'easy', '5 minutes', ARRAY['US', 'CA', 'UK', 'AU'], ARRAY['mobile', 'desktop'], ARRAY['Age 18+', 'Valid email'], true),
('Download and Play Game', 'Download Candy Crush and reach level 10', 150, 'gaming', 'AdGem', 'medium', '15 minutes', ARRAY['US', 'CA'], ARRAY['mobile'], ARRAY['Android 8+', 'iOS 12+'], true),
('Sign up for Newsletter', 'Subscribe to our partner newsletter and confirm email', 25, 'email', 'Lootably', 'easy', '2 minutes', ARRAY['US', 'CA', 'UK', 'AU', 'DE'], ARRAY['mobile', 'desktop'], ARRAY['Valid email'], true),
('Watch Video Series', 'Watch 5 short videos about finance', 75, 'video', 'OfferToro', 'easy', '10 minutes', ARRAY['US', 'CA', 'UK'], ARRAY['mobile', 'desktop'], ARRAY['Age 16+'], true),
('Install Shopping App', 'Download and register on shopping app', 100, 'app', 'BitLabs', 'medium', '8 minutes', ARRAY['US', 'CA', 'UK', 'AU'], ARRAY['mobile'], ARRAY['Android 7+', 'iOS 11+'], true),
('Complete Profile Survey', 'Fill out detailed profile information', 200, 'survey', 'Revenue Universe', 'hard', '20 minutes', ARRAY['US', 'CA', 'UK', 'AU', 'DE', 'FR'], ARRAY['mobile', 'desktop'], ARRAY['Age 21+', 'Valid phone'], true),
('Try Free Trial', 'Sign up for 7-day free trial service', 300, 'trial', 'Persona.ly', 'medium', '5 minutes', ARRAY['US', 'CA', 'UK'], ARRAY['mobile', 'desktop'], ARRAY['Credit card required', 'Age 18+'], true),
('Social Media Follow', 'Follow our partner on social media', 15, 'social', 'AyeT Studios', 'easy', '1 minute', ARRAY['US', 'CA', 'UK', 'AU', 'DE', 'FR', 'ES', 'IT'], ARRAY['mobile', 'desktop'], ARRAY['Social media account'], true);

-- Insert sample badges
INSERT INTO badges (name, description, icon, requirement_type, requirement_value, points_reward, is_active) VALUES
('First Steps', 'Complete your first offer', '🏆', 'tasks_completed', 1, 50, true),
('Getting Started', 'Complete 5 offers', '⭐', 'tasks_completed', 5, 100, true),
('Dedicated Earner', 'Complete 25 offers', '💎', 'tasks_completed', 25, 250, true),
('Power User', 'Complete 100 offers', '👑', 'tasks_completed', 100, 500, true),
('First Dollar', 'Earn your first $1.00', '💵', 'total_earned', 100, 25, true),
('Big Earner', 'Earn $10.00 total', '💰', 'total_earned', 1000, 100, true),
('High Roller', 'Earn $100.00 total', '🤑', 'total_earned', 10000, 500, true),
('Referral Master', 'Refer 10 friends', '👥', 'referrals_count', 10, 200, true),
('Social Butterfly', 'Refer 50 friends', '🦋', 'referrals_count', 50, 1000, true),
('Login Streak', 'Login 7 days in a row', '🔥', 'login_streak', 7, 75, true),
('Loyal User', 'Login 30 days in a row', '💪', 'login_streak', 30, 300, true),
('Survey Expert', 'Complete 20 surveys', '📊', 'category_completed', 20, 150, true),
('Gamer', 'Complete 15 gaming offers', '🎮', 'category_completed', 15, 200, true),
('Video Watcher', 'Complete 10 video offers', '📺', 'category_completed', 10, 100, true);

-- Insert system settings
INSERT INTO system_settings (key, value, description) VALUES
('min_withdrawal_amount', '200', 'Minimum withdrawal amount in points (200 = $2.00)'),
('max_withdrawal_amount', '50000', 'Maximum withdrawal amount in points (50000 = $500.00)'),
('withdrawal_fee_percentage', '0', 'Withdrawal fee percentage (0 = free)'),
('referral_commission_rate', '0.10', 'Referral commission rate (0.10 = 10%)'),
('daily_bonus_amount', '25', 'Daily login bonus in points'),
('max_login_streak', '30', 'Maximum login streak for bonuses'),
('points_per_dollar', '100', 'Points per dollar (100 points = $1.00)'),
('email_verification_required', 'true', 'Require email verification for withdrawals'),
('auto_approve_withdrawals', 'false', 'Auto approve withdrawals under certain amount'),
('max_auto_approve_amount', '1000', 'Max amount for auto approval (1000 = $10.00)'),
('platform_name', 'Dropiyo', 'Platform name'),
('support_email', 'support@dropiyo.com', 'Support email address'),
('telegram_support', 'https://t.me/dropiyo1', 'Telegram support link'),
('telegram_community', 'https://t.me/+1sySMQn2uQdjZWQ1', 'Telegram community link');

-- Insert sample notifications for testing
INSERT INTO notifications (user_id, title, message, type, is_read) 
SELECT 
  id as user_id,
  'Welcome to Dropiyo!' as title,
  'Start earning by completing offers and referring friends. Check out our available tasks!' as message,
  'welcome' as type,
  false as is_read
FROM profiles 
LIMIT 5;

-- Insert sample daily bonuses
INSERT INTO daily_bonuses (user_id, bonus_date, points_earned, login_streak)
SELECT 
  id as user_id,
  CURRENT_DATE as bonus_date,
  25 as points_earned,
  1 as login_streak
FROM profiles 
LIMIT 3;

-- Update some profiles with sample data
UPDATE profiles SET 
  balance = 150.00,
  total_earned = 150.00,
  login_streak = 3,
  last_login = NOW()
WHERE id IN (SELECT id FROM profiles LIMIT 2);

-- Insert sample user tasks (completed)
INSERT INTO user_tasks (user_id, task_id, status, points_earned, completed_at)
SELECT 
  p.id as user_id,
  t.id as task_id,
  'completed' as status,
  t.points as points_earned,
  NOW() - INTERVAL '1 day' as completed_at
FROM profiles p
CROSS JOIN tasks t
WHERE p.id IN (SELECT id FROM profiles LIMIT 2)
AND t.id IN (SELECT id FROM tasks LIMIT 3);

-- Insert sample transactions
INSERT INTO transactions (user_id, type, amount, description, reference_id)
SELECT 
  ut.user_id,
  'task_completion' as type,
  ut.points_earned as amount,
  'Completed: ' || t.title as description,
  ut.id::text as reference_id
FROM user_tasks ut
JOIN tasks t ON ut.task_id = t.id
WHERE ut.status = 'completed';

-- Insert sample withdrawals
INSERT INTO withdrawals (user_id, amount, method, account_details, status, requested_at)
SELECT 
  id as user_id,
  500 as amount, -- $5.00
  'DANA' as method,
  jsonb_build_object('phone', '+628123456789', 'name', 'John Doe') as account_details,
  'completed' as status,
  NOW() - INTERVAL '2 days' as requested_at
FROM profiles 
WHERE balance >= 5.00
LIMIT 1;

-- Insert sample referrals
INSERT INTO referrals (referrer_id, referred_id, commission_earned)
SELECT 
  p1.id as referrer_id,
  p2.id as referred_id,
  15 as commission_earned
FROM profiles p1
CROSS JOIN profiles p2
WHERE p1.id != p2.id
AND p1.id IN (SELECT id FROM profiles LIMIT 1)
AND p2.id IN (SELECT id FROM profiles OFFSET 1 LIMIT 2);

-- Award some badges to users
INSERT INTO user_badges (user_id, badge_id, earned_at)
SELECT 
  p.id as user_id,
  b.id as badge_id,
  NOW() as earned_at
FROM profiles p
CROSS JOIN badges b
WHERE p.id IN (SELECT id FROM profiles LIMIT 2)
AND b.name IN ('First Steps', 'Getting Started', 'First Dollar');

-- Update user levels based on completed tasks
UPDATE user_levels 
SET 
  current_xp = 150,
  total_xp = 150,
  current_level = 2
WHERE user_id IN (
  SELECT user_id 
  FROM user_tasks 
  WHERE status = 'completed' 
  GROUP BY user_id 
  HAVING COUNT(*) >= 3
);

-- Create some fraud logs for testing (admin features)
INSERT INTO fraud_logs (user_id, type, details, confidence_score, risk_level)
SELECT 
  id as user_id,
  'suspicious_activity' as type,
  jsonb_build_object('reason', 'Multiple rapid completions', 'count', 5) as details,
  0.7 as confidence_score,
  'medium' as risk_level
FROM profiles 
LIMIT 1;

COMMIT;

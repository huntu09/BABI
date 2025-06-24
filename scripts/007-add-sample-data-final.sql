-- Add sample data for testing all features (FINAL CORRECTED VERSION)

-- Insert sample tasks/offers using correct column names
INSERT INTO tasks (title, description, reward_amount, task_type, provider, external_id, requirements, is_active, countries, devices, url, image_url) VALUES
('Complete Survey - Shopping Habits', 'Answer questions about your shopping preferences and earn points', 50.00, 'survey', 'CPX Research', 'survey_001', '{"min_age": 18, "email_required": true}', true, ARRAY['US', 'CA', 'UK', 'AU'], ARRAY['mobile', 'desktop'], 'https://example.com/survey1', 'https://via.placeholder.com/300x200?text=Survey'),
('Download and Play Game', 'Download Candy Crush and reach level 10', 150.00, 'app_install', 'AdGem', 'game_001', '{"platform": "mobile", "min_level": 10}', true, ARRAY['US', 'CA'], ARRAY['mobile'], 'https://example.com/game1', 'https://via.placeholder.com/300x200?text=Game'),
('Sign up for Newsletter', 'Subscribe to our partner newsletter and confirm email', 25.00, 'signup', 'Lootably', 'newsletter_001', '{"email_verification": true}', true, ARRAY['US', 'CA', 'UK', 'AU', 'DE'], ARRAY['mobile', 'desktop'], 'https://example.com/newsletter1', 'https://via.placeholder.com/300x200?text=Newsletter'),
('Watch Video Series', 'Watch 5 short videos about finance', 75.00, 'video', 'OfferToro', 'video_001', '{"min_age": 16, "video_count": 5}', true, ARRAY['US', 'CA', 'UK'], ARRAY['mobile', 'desktop'], 'https://example.com/video1', 'https://via.placeholder.com/300x200?text=Video'),
('Install Shopping App', 'Download and register on shopping app', 100.00, 'app_install', 'BitLabs', 'app_001', '{"platform": "mobile", "registration_required": true}', true, ARRAY['US', 'CA', 'UK', 'AU'], ARRAY['mobile'], 'https://example.com/app1', 'https://via.placeholder.com/300x200?text=App'),
('Complete Profile Survey', 'Fill out detailed profile information', 200.00, 'survey', 'Revenue Universe', 'survey_002', '{"min_age": 21, "phone_required": true}', true, ARRAY['US', 'CA', 'UK', 'AU', 'DE', 'FR'], ARRAY['mobile', 'desktop'], 'https://example.com/survey2', 'https://via.placeholder.com/300x200?text=Profile'),
('Try Free Trial', 'Sign up for 7-day free trial service', 300.00, 'offer', 'Persona.ly', 'trial_001', '{"credit_card": true, "min_age": 18}', true, ARRAY['US', 'CA', 'UK'], ARRAY['mobile', 'desktop'], 'https://example.com/trial1', 'https://via.placeholder.com/300x200?text=Trial'),
('Social Media Follow', 'Follow our partner on social media', 15.00, 'offer', 'AyeT Studios', 'social_001', '{"social_account": true}', true, ARRAY['US', 'CA', 'UK', 'AU', 'DE', 'FR', 'ES', 'IT'], ARRAY['mobile', 'desktop'], 'https://example.com/social1', 'https://via.placeholder.com/300x200?text=Social');

-- Insert sample badges (check if table exists first)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'badges') THEN
        INSERT INTO badges (name, description, icon, requirement_type, requirement_value, reward_amount, is_active) VALUES
        ('First Steps', 'Complete your first offer', '🏆', 'tasks_completed', 1, 50.00, true),
        ('Getting Started', 'Complete 5 offers', '⭐', 'tasks_completed', 5, 100.00, true),
        ('Dedicated Earner', 'Complete 25 offers', '💎', 'tasks_completed', 25, 250.00, true),
        ('Power User', 'Complete 100 offers', '👑', 'tasks_completed', 100, 500.00, true),
        ('First Dollar', 'Earn your first $1.00', '💵', 'amount_earned', 100, 25.00, true),
        ('Big Earner', 'Earn $10.00 total', '💰', 'amount_earned', 1000, 100.00, true),
        ('High Roller', 'Earn $100.00 total', '🤑', 'amount_earned', 10000, 500.00, true),
        ('Referral Master', 'Refer 10 friends', '👥', 'referrals_made', 10, 200.00, true),
        ('Social Butterfly', 'Refer 50 friends', '🦋', 'referrals_made', 50, 1000.00, true),
        ('Login Streak', 'Login 7 days in a row', '🔥', 'days_active', 7, 75.00, true),
        ('Loyal User', 'Login 30 days in a row', '💪', 'days_active', 30, 300.00, true),
        ('Survey Expert', 'Complete 20 surveys', '📊', 'tasks_completed', 20, 150.00, true),
        ('Gamer', 'Complete 15 gaming offers', '🎮', 'tasks_completed', 15, 200.00, true),
        ('Video Watcher', 'Complete 10 video offers', '📺', 'tasks_completed', 10, 100.00, true)
        ON CONFLICT (name) DO NOTHING;
    END IF;
END $$;

-- Insert system settings (check if table exists first)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_settings') THEN
        INSERT INTO system_settings (setting_key, setting_value, description) VALUES
        ('min_withdrawal_amount', '200', 'Minimum withdrawal amount in points (200 = $2.00)'),
        ('max_withdrawal_amount', '50000', 'Maximum withdrawal amount in points (50000 = $500.00)'),
        ('withdrawal_processing_fee', '0', 'Withdrawal fee percentage (0 = free)'),
        ('referral_commission_rate', '0.10', 'Referral commission rate (0.10 = 10%)'),
        ('daily_login_bonus', '25', 'Daily login bonus in points'),
        ('max_login_streak', '30', 'Maximum login streak for bonuses'),
        ('points_per_dollar', '100', 'Points per dollar (100 points = $1.00)'),
        ('email_verification_required', '"true"', 'Require email verification for withdrawals'),
        ('auto_approve_withdrawals', '"false"', 'Auto approve withdrawals under certain amount'),
        ('max_auto_approve_amount', '1000', 'Max amount for auto approval (1000 = $10.00)'),
        ('platform_name', '"Dropiyo"', 'Platform name'),
        ('support_email', '"support@dropiyo.com"', 'Support email address'),
        ('telegram_support', '"https://t.me/dropiyo1"', 'Telegram support link'),
        ('telegram_community', '"https://t.me/+1sySMQn2uQdjZWQ1"', 'Telegram community link')
        ON CONFLICT (setting_key) DO NOTHING;
    END IF;
END $$;

-- Update some profiles with sample data (only if profiles exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        UPDATE profiles SET 
          balance = 150.00,
          total_earned = 1.50,
          login_streak = 3,
          last_login = NOW()
        WHERE id IN (SELECT id FROM profiles LIMIT 2);
    END IF;
END $$;

-- Insert sample user tasks (completed) - using correct column names
DO $$
DECLARE
    profile_record RECORD;
    task_record RECORD;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_tasks') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles')
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
        
        -- Get first 2 profiles and first 3 tasks
        FOR profile_record IN (SELECT id FROM profiles LIMIT 2) LOOP
            FOR task_record IN (SELECT id, reward_amount FROM tasks LIMIT 3) LOOP
                INSERT INTO user_tasks (user_id, task_id, status, reward_earned, completed_at)
                VALUES (
                    profile_record.id,
                    task_record.id,
                    'completed',
                    task_record.reward_amount,
                    NOW() - INTERVAL '1 day'
                )
                ON CONFLICT (user_id, task_id) DO NOTHING;
            END LOOP;
        END LOOP;
    END IF;
END $$;

-- Insert sample transactions
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_tasks') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
        
        INSERT INTO transactions (user_id, type, amount, description, reference_id)
        SELECT 
          ut.user_id,
          'earn' as type,
          ut.reward_earned as amount,
          'Completed: ' || t.title as description,
          ut.id as reference_id
        FROM user_tasks ut
        JOIN tasks t ON ut.task_id = t.id
        WHERE ut.status = 'completed'
        AND NOT EXISTS (
            SELECT 1 FROM transactions tr 
            WHERE tr.reference_id = ut.id
        );
    END IF;
END $$;

-- Insert sample withdrawals
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'withdrawals') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        
        INSERT INTO withdrawals (user_id, amount, method, account_details, status, created_at)
        SELECT 
          id as user_id,
          500.00 as amount, -- $5.00 worth
          'paypal' as method,
          '{"email": "user@example.com", "name": "John Doe"}'::jsonb as account_details,
          'completed' as status,
          NOW() - INTERVAL '2 days' as created_at
        FROM profiles 
        WHERE balance >= 500
        LIMIT 1
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Insert sample referrals (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'referrals') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        
        INSERT INTO referrals (referrer_id, referred_id, bonus_earned)
        SELECT 
          p1.id as referrer_id,
          p2.id as referred_id,
          15.00 as bonus_earned
        FROM profiles p1
        CROSS JOIN profiles p2
        WHERE p1.id != p2.id
        AND p1.id IN (SELECT id FROM profiles LIMIT 1)
        AND p2.id IN (SELECT id FROM profiles OFFSET 1 LIMIT 2)
        ON CONFLICT (referrer_id, referred_id) DO NOTHING;
    END IF;
END $$;

-- Award some badges to users (if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_badges') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'badges')
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        
        INSERT INTO user_badges (user_id, badge_id, earned_at)
        SELECT 
          p.id as user_id,
          b.id as badge_id,
          NOW() as earned_at
        FROM profiles p
        CROSS JOIN badges b
        WHERE p.id IN (SELECT id FROM profiles LIMIT 2)
        AND b.name IN ('First Steps', 'Getting Started', 'First Dollar')
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
END $$;

-- Update user levels based on completed tasks (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_levels') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_tasks') THEN
        
        INSERT INTO user_levels (user_id, current_level, current_xp, total_xp)
        SELECT 
            user_id,
            2 as current_level,
            150 as current_xp,
            150 as total_xp
        FROM user_tasks 
        WHERE status = 'completed' 
        GROUP BY user_id 
        HAVING COUNT(*) >= 3
        ON CONFLICT (user_id) DO UPDATE SET
            current_xp = 150,
            total_xp = 150,
            current_level = 2;
    END IF;
END $$;

-- Insert sample notifications
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        
        INSERT INTO notifications (user_id, title, message, type, is_read) 
        SELECT 
          id as user_id,
          'Welcome to Dropiyo!' as title,
          'Start earning by completing offers and referring friends. Check out our available tasks!' as message,
          'info' as type,
          false as is_read
        FROM profiles 
        LIMIT 5;
    END IF;
END $$;

-- Insert sample daily bonuses (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_bonuses') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        
        INSERT INTO daily_bonuses (user_id, bonus_date, amount, streak_count)
        SELECT 
          id as user_id,
          CURRENT_DATE as bonus_date,
          25.00 as amount,
          1 as streak_count
        FROM profiles 
        LIMIT 3
        ON CONFLICT (user_id, bonus_date) DO NOTHING;
    END IF;
END $$;

-- Show what was inserted for verification
DO $$
BEGIN
    RAISE NOTICE 'Sample data insertion completed!';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
        RAISE NOTICE 'Tasks inserted: %', (SELECT COUNT(*) FROM tasks);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE 'Profiles with data: %', (SELECT COUNT(*) FROM profiles WHERE balance > 0);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_tasks') THEN
        RAISE NOTICE 'User tasks completed: %', (SELECT COUNT(*) FROM user_tasks WHERE status = 'completed');
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
        RAISE NOTICE 'Transactions created: %', (SELECT COUNT(*) FROM transactions);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'withdrawals') THEN
        RAISE NOTICE 'Withdrawals created: %', (SELECT COUNT(*) FROM withdrawals);
    END IF;
END $$;

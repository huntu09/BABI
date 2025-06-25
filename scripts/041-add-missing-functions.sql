-- Function to increment offer clicks
CREATE OR REPLACE FUNCTION increment_offer_clicks(offer_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE cached_offers 
    SET clicks_count = clicks_count + 1,
        updated_at = now()
    WHERE id = offer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment offer completions
CREATE OR REPLACE FUNCTION increment_offer_completions(offer_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE cached_offers 
    SET completions_count = completions_count + 1,
        conversion_rate_percent = CASE 
            WHEN clicks_count > 0 THEN 
                ROUND((completions_count + 1.0) / clicks_count * 100, 2)
            ELSE 0 
        END,
        updated_at = now()
    WHERE id = offer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user balance (if not exists)
CREATE OR REPLACE FUNCTION update_user_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET balance = balance + p_amount,
        total_earned = CASE 
            WHEN p_amount > 0 THEN total_earned + p_amount 
            ELSE total_earned 
        END,
        updated_at = now()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add sample badges if none exist
INSERT INTO badges (name, description, icon, requirement_type, requirement_value, reward_amount) 
VALUES 
    ('First Steps', 'Complete your first task', '🚀', 'tasks_completed', 1, 0.10),
    ('Task Master', 'Complete 10 tasks', '⭐', 'tasks_completed', 10, 0.50),
    ('Point Collector', 'Earn $1.00', '💰', 'points_earned', 100, 0.25),
    ('High Earner', 'Earn $10.00', '💎', 'points_earned', 1000, 1.00),
    ('Loyal User', '7 day login streak', '🔥', 'login_streak', 7, 0.50),
    ('Streak Master', '30 day login streak', '👑', 'login_streak', 30, 2.00),
    ('Referral Pro', 'Refer 5 friends', '🤝', 'referrals_made', 5, 1.00),
    ('Cashout King', 'Make 3 withdrawals', '💳', 'withdrawals_made', 3, 0.75)
ON CONFLICT (name) DO NOTHING;

COMMENT ON FUNCTION increment_offer_clicks IS 'Safely increment offer click count';
COMMENT ON FUNCTION increment_offer_completions IS 'Safely increment offer completion count and update conversion rate';
COMMENT ON FUNCTION update_user_balance IS 'Safely update user balance and total earned';

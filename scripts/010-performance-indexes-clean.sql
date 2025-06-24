-- 🚀 PERFORMANCE OPTIMIZATION - DATABASE INDEXES
-- This script adds strategic indexes to improve query performance

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_balance ON profiles(balance);

-- Tasks table indexes  
CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_provider ON tasks(provider);
CREATE INDEX IF NOT EXISTS idx_tasks_reward_amount ON tasks(reward_amount);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_active_type ON tasks(is_active, task_type);

-- User tasks table indexes
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_completed_at ON user_tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_status ON user_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_completed ON user_tasks(user_id, completed_at);

-- Withdrawals table indexes
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_processed_at ON withdrawals(processed_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawals(user_id, status);

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Referrals table indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at);

-- User badges table indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at);

-- Fraud logs table indexes
CREATE INDEX IF NOT EXISTS idx_fraud_logs_user_id ON fraud_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_event_type ON fraud_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_risk_level ON fraud_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_created_at ON fraud_logs(created_at);

-- User levels table indexes
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_current_level ON user_levels(current_level);
CREATE INDEX IF NOT EXISTS idx_user_levels_total_xp ON user_levels(total_xp);

-- Offerwall completions table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_offerwall_completions_user_id ON offerwall_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_offerwall_completions_status ON offerwall_completions(status);
CREATE INDEX IF NOT EXISTS idx_offerwall_completions_provider ON offerwall_completions(provider);
CREATE INDEX IF NOT EXISTS idx_offerwall_completions_completed_at ON offerwall_completions(completed_at);

-- Push subscriptions table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_is_active ON push_subscriptions(is_active);

-- Daily bonuses table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_daily_bonuses_user_id ON daily_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_bonuses_bonus_date ON daily_bonuses(bonus_date);
CREATE INDEX IF NOT EXISTS idx_daily_bonuses_user_date ON daily_bonuses(user_id, bonus_date);

-- Real offer completions table indexes (if exists from hybrid system)
CREATE INDEX IF NOT EXISTS idx_real_completions_user_id ON real_offer_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_real_completions_provider_id ON real_offer_completions(provider_id);
CREATE INDEX IF NOT EXISTS idx_real_completions_status ON real_offer_completions(status);
CREATE INDEX IF NOT EXISTS idx_real_completions_completed_at ON real_offer_completions(completed_at);

-- User task preferences table indexes (if exists from hybrid system)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_task_preferences(user_id);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_tasks_active_reward ON tasks(is_active, reward_amount DESC);
CREATE INDEX IF NOT EXISTS idx_user_tasks_completion ON user_tasks(user_id, task_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_recent ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_pending ON withdrawals(status, created_at) WHERE status = 'pending';

-- Analyze tables for better query planning
ANALYZE profiles;
ANALYZE tasks;
ANALYZE user_tasks;
ANALYZE withdrawals;
ANALYZE transactions;
ANALYZE notifications;
ANALYZE referrals;
ANALYZE user_badges;
ANALYZE fraud_logs;
ANALYZE user_levels;

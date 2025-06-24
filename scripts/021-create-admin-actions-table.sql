-- Create admin_actions table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL,
  target_type text NOT NULL, -- 'user', 'withdrawal', 'task', 'system'
  target_id uuid NULL,
  details jsonb DEFAULT '{}'::jsonb,
  reason text NULL,
  ip_address inet NULL,
  user_agent text NULL,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT admin_actions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE CASCADE,
  
  CONSTRAINT admin_actions_action_type_check CHECK (
    action_type = ANY(ARRAY[
      'user_ban'::text,
      'user_unban'::text,
      'user_suspend'::text,
      'withdrawal_approve'::text,
      'withdrawal_reject'::text,
      'task_create'::text,
      'task_update'::text,
      'task_delete'::text,
      'settings_update'::text,
      'fraud_review'::text
    ])
  ),
  
  CONSTRAINT admin_actions_target_type_check CHECK (
    target_type = ANY(ARRAY[
      'user'::text,
      'withdrawal'::text,
      'task'::text,
      'system'::text
    ])
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions USING btree (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions USING btree (action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_type ON public.admin_actions USING btree (target_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_created ON public.admin_actions USING btree (admin_id, created_at DESC);

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('min_withdrawal_amount', '2.00', 'Minimum withdrawal amount in USD'),
('max_withdrawal_amount', '1000.00', 'Maximum withdrawal amount in USD'),
('referral_commission_rate', '0.10', 'Referral commission rate (10%)'),
('daily_login_bonus', '0.25', 'Daily login bonus amount in USD'),
('maintenance_mode', 'false', 'Platform maintenance mode'),
('allow_new_registrations', 'true', 'Allow new user registrations'),
('fraud_detection_enabled', 'true', 'Enable fraud detection system'),
('auto_ban_threshold', '0.85', 'Auto-ban threshold for fraud score')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample badges
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value, reward_amount) VALUES
('First Steps', 'Complete your first task', '🎯', 'tasks_completed', 1, 0.50),
('Task Master', 'Complete 10 tasks', '⭐', 'tasks_completed', 10, 2.00),
('High Achiever', 'Complete 50 tasks', '🏆', 'tasks_completed', 50, 10.00),
('First Dollar', 'Earn your first $1', '💰', 'amount_earned', 100, 0.25),
('Big Earner', 'Earn $50 total', '💎', 'amount_earned', 5000, 5.00),
('Referral King', 'Refer 5 friends', '👥', 'referrals_made', 5, 3.00),
('Loyal User', 'Active for 30 days', '📅', 'days_active', 30, 2.50)
ON CONFLICT (name) DO NOTHING;

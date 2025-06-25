-- 🔧 FIX USER_TASKS TABLE SCHEMA

-- 1. Add missing status value and make foreign keys NOT NULL
ALTER TABLE public.user_tasks 
DROP CONSTRAINT IF EXISTS user_tasks_status_check;

-- Add the missing 'in_progress' status
ALTER TABLE public.user_tasks 
ADD CONSTRAINT user_tasks_status_check CHECK (
  status = ANY (ARRAY[
    'pending'::text,
    'in_progress'::text,
    'completed'::text,
    'rejected'::text
  ])
);

-- 2. Make foreign keys NOT NULL (after ensuring no NULL values exist)
UPDATE public.user_tasks SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE public.user_tasks SET task_id = '00000000-0000-0000-0000-000000000000' WHERE task_id IS NULL;

ALTER TABLE public.user_tasks 
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN task_id SET NOT NULL;

-- 3. Add business logic constraints
ALTER TABLE public.user_tasks 
ADD CONSTRAINT user_tasks_completed_at_check 
CHECK (
  (status = 'completed' AND completed_at IS NOT NULL) OR 
  (status != 'completed')
);

-- 4. Add reward validation constraint
ALTER TABLE public.user_tasks 
ADD CONSTRAINT user_tasks_reward_positive_check 
CHECK (reward_earned IS NULL OR reward_earned >= 0);

-- 5. Add composite indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_status 
ON public.user_tasks USING btree (task_id, status) 
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_tasks_daily_completions 
ON public.user_tasks USING btree (user_id, DATE(completed_at)) 
TABLESPACE pg_default
WHERE status = 'completed';

-- 6. Create function to validate task completion business rules
CREATE OR REPLACE FUNCTION validate_user_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure completed_at is set when status is completed
  IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- Prevent duplicate completions
  IF NEW.status = 'completed' THEN
    IF EXISTS (
      SELECT 1 FROM user_tasks 
      WHERE user_id = NEW.user_id 
      AND task_id = NEW.task_id 
      AND status = 'completed'
      AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'User has already completed this task';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for validation
DROP TRIGGER IF EXISTS validate_user_task_completion_trigger ON user_tasks;
CREATE TRIGGER validate_user_task_completion_trigger
  BEFORE INSERT OR UPDATE ON user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_task_completion();

-- 8. Add helpful views for common queries
CREATE OR REPLACE VIEW user_task_completions AS
SELECT 
  ut.user_id,
  ut.task_id,
  ut.reward_earned,
  ut.completed_at,
  t.title as task_title,
  t.provider as task_provider,
  t.task_type,
  p.email as user_email,
  p.username
FROM user_tasks ut
JOIN tasks t ON ut.task_id = t.id
JOIN profiles p ON ut.user_id = p.id
WHERE ut.status = 'completed';

-- 9. Add function to get user task stats
CREATE OR REPLACE FUNCTION get_user_task_stats(p_user_id uuid)
RETURNS TABLE (
  total_completed bigint,
  total_earned numeric,
  today_completed bigint,
  today_earned numeric,
  this_week_completed bigint,
  this_week_earned numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status = 'completed') as total_completed,
    COALESCE(SUM(reward_earned) FILTER (WHERE status = 'completed'), 0) as total_earned,
    COUNT(*) FILTER (WHERE status = 'completed' AND DATE(completed_at) = CURRENT_DATE) as today_completed,
    COALESCE(SUM(reward_earned) FILTER (WHERE status = 'completed' AND DATE(completed_at) = CURRENT_DATE), 0) as today_earned,
    COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= DATE_TRUNC('week', CURRENT_DATE)) as this_week_completed,
    COALESCE(SUM(reward_earned) FILTER (WHERE status = 'completed' AND completed_at >= DATE_TRUNC('week', CURRENT_DATE)), 0) as this_week_earned
  FROM user_tasks
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Verify the trigger function exists (create if missing)
CREATE OR REPLACE FUNCTION notify_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on completed status
  IF NEW.status = 'completed' THEN
    -- Send notification (implement as needed)
    PERFORM pg_notify('task_completed', json_build_object(
      'user_id', NEW.user_id,
      'task_id', NEW.task_id,
      'reward_earned', NEW.reward_earned,
      'completed_at', NEW.completed_at
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

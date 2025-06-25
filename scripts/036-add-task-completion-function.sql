-- Create function to safely increment task completion count
CREATE OR REPLACE FUNCTION increment_task_completion(task_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE tasks 
  SET completion_count = completion_count + 1,
      updated_at = now()
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;

-- Add index for completion count queries
CREATE INDEX IF NOT EXISTS idx_tasks_completion_count 
ON public.tasks USING btree (completion_count DESC) 
TABLESPACE pg_default;

-- Add index for expiration queries
CREATE INDEX IF NOT EXISTS idx_tasks_expires_at 
ON public.tasks USING btree (expires_at) 
TABLESPACE pg_default
WHERE expires_at IS NOT NULL;

-- Add composite index for active non-expired tasks
CREATE INDEX IF NOT EXISTS idx_tasks_active_non_expired 
ON public.tasks USING btree (is_active, expires_at) 
TABLESPACE pg_default
WHERE is_active = true;

-- Fix the notify_task_completion function to use correct field name
CREATE OR REPLACE FUNCTION public.notify_task_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- This will trigger real-time notifications
    -- Use reward_earned instead of reward_amount (which doesn't exist in user_tasks table)
    RAISE NOTICE 'Task completed: % points for user %', NEW.reward_earned, NEW.user_id;
    RETURN NEW;
END;
$function$;

-- Re-enable the trigger if it was disabled
ALTER TABLE user_tasks ENABLE TRIGGER task_completion_notify;

-- Temporarily disable the trigger to test
ALTER TABLE user_tasks DISABLE TRIGGER task_completion_notify;

-- Check what the trigger function is trying to do
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'notify_task_completion';

-- List all triggers on user_tasks table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'user_tasks';

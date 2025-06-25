-- Enable real-time for notification-related tables
DO $$
BEGIN
    RAISE NOTICE 'Enabling real-time notifications...';
    
    -- Enable real-time for user_tasks table
    ALTER PUBLICATION supabase_realtime ADD TABLE user_tasks;
    RAISE NOTICE 'Added user_tasks to real-time publication';
    
    -- Enable real-time for withdrawals table  
    ALTER PUBLICATION supabase_realtime ADD TABLE withdrawals;
    RAISE NOTICE 'Added withdrawals to real-time publication';
    
    -- Enable real-time for referrals table
    ALTER PUBLICATION supabase_realtime ADD TABLE referrals;
    RAISE NOTICE 'Added referrals to real-time publication';
    
    -- Set replica identity for proper real-time updates
    ALTER TABLE user_tasks REPLICA IDENTITY FULL;
    ALTER TABLE withdrawals REPLICA IDENTITY FULL; 
    ALTER TABLE referrals REPLICA IDENTITY FULL;
    RAISE NOTICE 'Set replica identity for real-time tables';
    
    -- Create notification triggers for testing
    CREATE OR REPLACE FUNCTION notify_task_completion()
    RETURNS TRIGGER AS $$
    BEGIN
        -- This will trigger real-time notifications
        RAISE NOTICE 'Task completed: % points for user %', NEW.points_earned, NEW.user_id;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Create trigger for task completions
    DROP TRIGGER IF EXISTS task_completion_notify ON user_tasks;
    CREATE TRIGGER task_completion_notify
        AFTER INSERT ON user_tasks
        FOR EACH ROW
        EXECUTE FUNCTION notify_task_completion();
    
    RAISE NOTICE 'Real-time notification system enabled successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error enabling real-time: %', SQLERRM;
        RAISE NOTICE 'Some features may not work, but system will continue';
END $$;

-- Grant necessary permissions
GRANT SELECT ON user_tasks TO authenticated;
GRANT SELECT ON withdrawals TO authenticated; 
GRANT SELECT ON referrals TO authenticated;

-- Create indexes for better real-time performance
CREATE INDEX IF NOT EXISTS idx_user_tasks_realtime ON user_tasks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_realtime ON withdrawals(user_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_realtime ON referrals(referrer_id, created_at DESC);

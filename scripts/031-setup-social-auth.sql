-- Enable social authentication providers in Supabase
-- This script documents the required Supabase dashboard configuration

-- 1. Go to Supabase Dashboard > Authentication > Providers
-- 2. Enable the following providers:

-- GOOGLE OAUTH:
-- - Enable Google provider
-- - Add Client ID and Client Secret from Google Console
-- - Authorized redirect URI: https://your-project.supabase.co/auth/v1/callback

-- FACEBOOK OAUTH:
-- - Enable Facebook provider  
-- - Add App ID and App Secret from Facebook Developers
-- - Valid OAuth Redirect URI: https://your-project.supabase.co/auth/v1/callback

-- APPLE OAUTH:
-- - Enable Apple provider
-- - Add Service ID, Team ID, Key ID, and Private Key from Apple Developer
-- - Return URL: https://your-project.supabase.co/auth/v1/callback

-- 3. Update Site URL in Authentication > Settings:
-- Site URL: https://revd.online
-- Additional redirect URLs: https://revd.online/dashboard

-- Note: This configuration must be done in Supabase Dashboard, not via SQL

-- UPGRADE PROFILE FIELDS 2026
-- Adding Bio and Eco Preferences to both profiles and users tables

-- 1. Profiles Table Enhancement
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS eco_preferences JSONB DEFAULT '{"transport": "public", "energy": "manual", "diet": "local"}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Bronze';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_goal_co2 NUMERIC DEFAULT 10;

-- 2. Users Table Enhancement (Sync)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS eco_preferences JSONB DEFAULT '{"transport": "public", "energy": "manual", "diet": "local"}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Bronze';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS daily_goal_co2 NUMERIC DEFAULT 10;

-- 3. Update handle_new_user to include defaults if needed (it already handles most)

-- 4. Enable Realtime for any missing
-- (Usually already enabled in previous migrations, but let's be sure)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE users;
    END IF;
END $$;

-- ==========================================
-- MOECO COMPREHENSIVE DATABASE REPAIR & POLICY FIX
-- ==========================================

-- 1. CLEANUP POLICIES (Solves the "already exists" error)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- This block drops ALL policies on ALL tables in the public schema 
    -- to ensure a clean slate and avoid "already exists" errors.
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. ENSURE TABLES EXIST (Creating if not present)
-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    points INTEGER DEFAULT 0,
    experience_points INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    green_coins INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    governorate TEXT,
    city TEXT,
    country TEXT DEFAULT 'Egypt',
    social_bracket TEXT DEFAULT 'middle',
    country_id UUID,
    governorate_id UUID,
    city_id UUID,
    language TEXT DEFAULT 'ar',
    theme TEXT DEFAULT 'light',
    role TEXT DEFAULT 'user',
    is_admin BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    family_id UUID,
    streak_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mirror table 'users' if some services expect it specifically
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    full_name TEXT,
    email TEXT,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    green_coins INTEGER DEFAULT 0,
    governorate TEXT,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    family_id UUID,
    streak_count INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carbon Activities
CREATE TABLE IF NOT EXISTS public.carbon_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    sector TEXT NOT NULL,
    value NUMERIC DEFAULT 0,
    carbon_impact NUMERIC DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_activities ENABLE ROW LEVEL SECURITY;

-- 4. RECREATE POLICIES (Safe version)
-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users 
CREATE POLICY "Users table is readable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own record" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own record" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Carbon Activities
CREATE POLICY "Users can view own carbon activities" ON public.carbon_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own carbon activities" ON public.carbon_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. AUTH TRIGGER (Auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (
    id, email, name, full_name, avatar_url, 
    country_id, governorate_id, social_bracket
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', ''), 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'country_id')::UUID,
    (new.raw_user_meta_data->>'governorate_id')::UUID,
    COALESCE(new.raw_user_meta_data->>'social_bracket', 'middle')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = NOW();
  
  -- Insert into users (for compatibility)
  INSERT INTO public.users (id, email, name, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    updated_at = NOW();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_carbon_user ON public.carbon_activities(user_id);


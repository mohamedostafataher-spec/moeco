
-- 1. Ensure Profiles table exists with correct columns
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'citizen',
    governorate_id UUID,
    city_id UUID,
    country_id UUID,
    social_bracket TEXT DEFAULT 'middle',
    green_coins INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ENABLE Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy: Allow users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 4. Create Policy: Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 5. Create Policy: Allow profile insertion during signup
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
    FOR INSERT WITH CHECK (true); -- Ideally (auth.uid() = id), but needs careful bypass for initial signup trigger

-- 6. Grant basic permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;

-- 7. Ensure Countries/Governorates/Cities are readable by everyone
ALTER TABLE IF EXISTS public.countries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public countries access" ON public.countries;
CREATE POLICY "Public countries access" ON public.countries FOR SELECT USING (true);

ALTER TABLE IF EXISTS public.governorates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public governorates access" ON public.governorates;
CREATE POLICY "Public governorates access" ON public.governorates FOR SELECT USING (true);

ALTER TABLE IF EXISTS public.cities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public cities access" ON public.cities;
CREATE POLICY "Public cities access" ON public.cities FOR SELECT USING (true);

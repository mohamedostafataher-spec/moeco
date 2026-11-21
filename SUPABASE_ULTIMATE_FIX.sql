-- MO ECO: ULTIMATE DATABASE REPAIR & RESILIENCE SCRIPT
-- Purpose: Permanently fix "Database error saving new user" by aligning schema with frontend logic.
-- Instructions: Copy and run this ENTIRE script in the Supabase SQL Editor.

-- 1. UPGRADE PROFILES TABLE (Add Missing Columns)
DO $$ 
BEGIN 
    -- Add full_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;

    -- Add social_bracket if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='social_bracket') THEN
        ALTER TABLE public.profiles ADD COLUMN social_bracket TEXT DEFAULT 'middle';
    END IF;

    -- Add location UUID columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='country_id') THEN
        ALTER TABLE public.profiles ADD COLUMN country_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='governorate_id') THEN
        ALTER TABLE public.profiles ADD COLUMN governorate_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='city_id') THEN
        ALTER TABLE public.profiles ADD COLUMN city_id UUID;
    END IF;
END $$;

-- 2. ENSURE COMMUNITY MEMBERS TABLE EXISTS
CREATE TABLE IF NOT EXISTS public.community_members (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT DEFAULT 'member',
    status TEXT DEFAULT 'active',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Community Members
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own membership." ON public.community_members;
CREATE POLICY "Users can manage own membership." ON public.community_members FOR ALL USING (auth.uid() = user_id);

-- 3. THE ULTIMATE USER CREATION TRIGGER (Handle Upsert & Metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    full_name,
    email, 
    avatar_url, 
    country_id, 
    governorate_id, 
    city_id, 
    social_bracket,
    country,
    governorate,
    city,
    updated_at
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', ''), 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email, 
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'country_id')::UUID,
    (new.raw_user_meta_data->>'governorate_id')::UUID,
    (new.raw_user_meta_data->>'city_id')::UUID,
    COALESCE(new.raw_user_meta_data->>'social_bracket', 'middle'),
    new.raw_user_meta_data->>'country_name',
    new.raw_user_meta_data->>'governorate_name',
    new.raw_user_meta_data->>'city_name',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    country_id = EXCLUDED.country_id,
    governorate_id = EXCLUDED.governorate_id,
    city_id = EXCLUDED.city_id,
    social_bracket = EXCLUDED.social_bracket,
    country = EXCLUDED.country,
    governorate = EXCLUDED.governorate,
    city = EXCLUDED.city,
    updated_at = NOW();
  
  -- Auto-join community
  INSERT INTO public.community_members (user_id, role, status, joined_at)
  VALUES (new.id, 'member', 'active', NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. APPLY TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. FIX RLS POLICIES (Allow Manual Upsert from Client)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile." ON public.profiles;
CREATE POLICY "Users can insert own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 6. DATA SYNC (Fix Existing Corrupt Profiles)
UPDATE public.profiles p
SET 
  name = COALESCE(u.raw_user_meta_data->>'name', p.name),
  email = COALESCE(u.email, p.email),
  full_name = COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', p.full_name),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id AND (p.name IS NULL OR p.name = '' OR p.full_name IS NULL);

SELECT 'ULTIMATE DATABASE FIX APPLIED SUCCESSFULLY!' as result;

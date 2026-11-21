-- MO ECO - SUPABASE FIX: Resolving Database Error Saving New User
-- Purpose: This script ensures that user profiles are created or updated correctly without duplicate key errors.
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Update the User Creation Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    avatar_url, 
    country_id, 
    governorate_id, 
    city_id, 
    social_bracket,
    country,
    governorate,
    city
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', ''), 
    new.email, 
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'country_id')::UUID,
    (new.raw_user_meta_data->>'governorate_id')::UUID,
    (new.raw_user_meta_data->>'city_id')::UUID,
    new.raw_user_meta_data->>'social_bracket',
    new.raw_user_meta_data->>'country_name',
    new.raw_user_meta_data->>'governorate_name',
    new.raw_user_meta_data->>'city_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
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
  
  -- Ensure user is also in community_members
  INSERT INTO public.community_members (user_id, role, status, joined_at)
  VALUES (new.id, 'member', 'active', NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure Trigger is Active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Cleanup existing duplicates or missing data profiles
-- Force updates for profiles that might have been partially created
UPDATE public.profiles p
SET 
  name = COALESCE(u.raw_user_meta_data->>'name', p.name),
  email = COALESCE(u.email, p.email),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id AND (p.name IS NULL OR p.name = '');

-- 4. Enable RLS and verify policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure users can insert/update their own profile
DROP POLICY IF EXISTS "Users can insert own profile." ON public.profiles;
CREATE POLICY "Users can insert own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Success Message to Console
SELECT 'Database resilient registration fixed successfully!' as status;

-- 5. Ensure Supporting Tables Exist
CREATE TABLE IF NOT EXISTS public.community_members (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT DEFAULT 'member',
    status TEXT DEFAULT 'active',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own membership." ON public.community_members FOR ALL USING (auth.uid() = user_id);

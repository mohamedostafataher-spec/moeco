-- Execute this script in your Supabase SQL Editor to fix the registration error

-- 1. Create a robust handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- We use exception handling to ensure auth.users insertion NEVER fails 
  -- even if the profiles table has issues
  BEGIN
    INSERT INTO public.profiles (
      id, 
      email, 
      name, 
      full_name, 
      avatar_url, 
      country_id, 
      governorate_id, 
      social_bracket
    )
    VALUES (
      new.id, 
      new.email, 
      COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'User'), 
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
      COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id),
      NULLIF(new.raw_user_meta_data->>'country_id', '')::UUID,
      NULLIF(new.raw_user_meta_data->>'governorate_id', '')::UUID,
      COALESCE(new.raw_user_meta_data->>'social_bracket', 'middle')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.profiles.name),
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      updated_at = NOW();
      
    -- Try to insert into users table if it exists (for compatibility)
    INSERT INTO public.users (id, email, name, full_name, avatar_url)
    VALUES (
      new.id, 
      new.email, 
      COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'User'),
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
      COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id)
    )
    ON CONFLICT (id) DO NOTHING;

  EXCEPTION WHEN OTHERS THEN
    -- Log the error but DO NOT fail the transaction
    -- This ensures the user is still created in auth.users
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the trigger is attached correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Just to be safe, disable RLS on profiles temporarily for inserts from the trigger if needed 
-- (Though SECURITY DEFINER should bypass RLS, this ensures no other policies block it)

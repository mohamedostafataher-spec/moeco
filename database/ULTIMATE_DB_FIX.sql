-- =========================================================================
-- ULTIMATE DATABASE FIX SCRIPT 
-- Copies all necessary tables, policies, and auth triggers 
-- for User Registration, Calculator, and Error Logs
-- =========================================================================

-- 1. FIX AUTH TRIGGER (Solves Registration taking forever / failing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Use EXCEPTION block to guarantee user is always created successfully
  BEGIN
    -- 1. Insert into profiles
    INSERT INTO public.profiles (
      id, email, name, full_name, avatar_url, country_id, governorate_id, social_bracket
    )
    VALUES (
      new.id, 
      new.email, 
      COALESCE(new.raw_user_meta_data->>'name', 'User'), 
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
      COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id),
      NULLIF(new.raw_user_meta_data->>'country_id', '')::UUID,
      NULLIF(new.raw_user_meta_data->>'governorate_id', '')::UUID,
      COALESCE(new.raw_user_meta_data->>'social_bracket', 'middle')
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- 2. Insert into users (fallback)
    INSERT INTO public.users (
      id, email, name, avatar_url
    )
    VALUES (
      new.id, 
      new.email, 
      COALESCE(new.raw_user_meta_data->>'name', 'User'),
      COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id)
    )
    ON CONFLICT (id) DO NOTHING;

  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. RECREATE ERROR LOGS (Solves 'Could not find the table error_logs')
DROP TABLE IF EXISTS public.error_logs CASCADE;
CREATE TABLE public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    stack TEXT,
    screen TEXT,
    user_email TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for all users" ON public.error_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for authenticated" ON public.error_logs FOR SELECT USING (auth.role() = 'authenticated');


-- 3. RECREATE CONSUMPTION RECORDS (Solves 'Smart Calculator' / 'Calculate Now' issues)
DROP TABLE IF EXISTS public.consumption_records CASCADE;
CREATE TABLE public.consumption_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sector TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT,
    carbon_impact NUMERIC,
    cost NUMERIC,
    description TEXT,
    record_date DATE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User insert cr" ON public.consumption_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User select cr" ON public.consumption_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User update cr" ON public.consumption_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User delete cr" ON public.consumption_records FOR DELETE USING (auth.uid() = user_id);

-- 3.b RECREATE CARBON FOOTPRINT LOGS (Solves 'carbon_footprint_logs' not found issue)
DROP TABLE IF EXISTS public.carbon_footprint_logs CASCADE;
CREATE TABLE public.carbon_footprint_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transport_emissions NUMERIC DEFAULT 0,
    electricity_emissions NUMERIC DEFAULT 0,
    gas_emissions NUMERIC DEFAULT 0,
    water_emissions NUMERIC DEFAULT 0,
    total_emissions NUMERIC DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.carbon_footprint_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User insert cf" ON public.carbon_footprint_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User select cf" ON public.carbon_footprint_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User update cf" ON public.carbon_footprint_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User delete cf" ON public.carbon_footprint_logs FOR DELETE USING (auth.uid() = user_id);


-- 4. RECREATE TRANSPORT EMISSIONS (Solves Transport calculations issues)
DROP TABLE IF EXISTS public.transport_emissions CASCADE;
CREATE TABLE public.transport_emissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transport_type TEXT NOT NULL,
    distance_km NUMERIC NOT NULL,
    co2_emissions NUMERIC,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.transport_emissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User insert" ON public.transport_emissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User select" ON public.transport_emissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User update" ON public.transport_emissions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User delete" ON public.transport_emissions FOR DELETE USING (auth.uid() = user_id);


-- 5. ENSURE POINTS/COINS COLUMNS EXIST 
-- This prevents issues where 'green_coins' or 'points' don't exist in users table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'green_coins') THEN
    ALTER TABLE public.users ADD COLUMN green_coins INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'points') THEN
    ALTER TABLE public.users ADD COLUMN points INTEGER DEFAULT 0;
  END IF;
END $$;

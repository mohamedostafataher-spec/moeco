-- =========================================================================
-- MOECO MASTER DATABASE SETUP (MERGED & OPTIMIZED)
-- =========================================================================

-- 1. ERROR LOGS
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    stack TEXT,
    screen TEXT,
    user_email TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.error_logs;
CREATE POLICY "Enable insert for all users" ON public.error_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON public.error_logs;
CREATE POLICY "Enable read for authenticated users only" ON public.error_logs FOR SELECT USING (auth.role() = 'authenticated');

-- 2. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title_ar TEXT,
    title_en TEXT,
    body_ar TEXT,
    body_en TEXT,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.notifications;
CREATE POLICY "Enable insert for all users" ON public.notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable read for users" ON public.notifications;
CREATE POLICY "Enable read for users" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "Enable update for users" ON public.notifications;
CREATE POLICY "Enable update for users" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 3. CARBON FOOTPRINT LOGS (With new columns)
CREATE TABLE IF NOT EXISTS public.carbon_footprint_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transport_emissions NUMERIC DEFAULT 0,
    electricity_emissions NUMERIC DEFAULT 0,
    gas_emissions NUMERIC DEFAULT 0,
    water_emissions NUMERIC DEFAULT 0,
    food_emissions NUMERIC DEFAULT 0,
    shopping_emissions NUMERIC DEFAULT 0,
    total_emissions NUMERIC DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carbon_footprint_logs' AND column_name = 'food_emissions') THEN
    ALTER TABLE public.carbon_footprint_logs ADD COLUMN food_emissions NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carbon_footprint_logs' AND column_name = 'shopping_emissions') THEN
    ALTER TABLE public.carbon_footprint_logs ADD COLUMN shopping_emissions NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carbon_footprint_logs' AND column_name = 'total_emissions') THEN
    ALTER TABLE public.carbon_footprint_logs ADD COLUMN total_emissions NUMERIC DEFAULT 0;
  END IF;
END $$;

ALTER TABLE public.carbon_footprint_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User write cf" ON public.carbon_footprint_logs;
CREATE POLICY "User write cf" ON public.carbon_footprint_logs FOR ALL USING (auth.uid() = user_id);

-- 4. CONSUMPTION RECORDS
CREATE TABLE IF NOT EXISTS public.consumption_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sector TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT,
    carbon_impact NUMERIC,
    cost NUMERIC,
    description TEXT,
    record_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User write cr" ON public.consumption_records;
CREATE POLICY "User write cr" ON public.consumption_records FOR ALL USING (auth.uid() = user_id);

-- 5. TRANSPORT EMISSIONS
CREATE TABLE IF NOT EXISTS public.transport_emissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transport_type TEXT NOT NULL,
    distance_km NUMERIC NOT NULL,
    co2_emissions NUMERIC,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.transport_emissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User write te" ON public.transport_emissions;
CREATE POLICY "User write te" ON public.transport_emissions FOR ALL USING (auth.uid() = user_id);

-- 6. UTILITY TIERS (EGYPT 2024/2025)
CREATE TABLE IF NOT EXISTS public.utility_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector TEXT NOT NULL,
    min NUMERIC NOT NULL,
    max NUMERIC,
    price NUMERIC NOT NULL,
    carbon_factor NUMERIC NOT NULL
);

ALTER TABLE public.utility_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all" ON public.utility_tiers;
CREATE POLICY "Enable read for all" ON public.utility_tiers FOR SELECT USING (true);

-- Insert/Refresh Tiers
TRUNCATE TABLE public.utility_tiers;
INSERT INTO public.utility_tiers (sector, min, max, price, carbon_factor) VALUES
  ('electricity', 0, 50, 0.68, 0.5),
  ('electricity', 50, 100, 0.78, 0.5),
  ('electricity', 100, 200, 0.95, 0.5),
  ('electricity', 200, 350, 1.55, 0.5),
  ('electricity', 350, 650, 1.95, 0.5),
  ('electricity', 650, 1000, 2.10, 0.5),
  ('electricity', 1000, 2000, 2.23, 0.5),
  ('electricity', 2000, NULL, 2.58, 0.5),
  ('gas', 0, 30, 6.0, 2.0),
  ('gas', 30, 60, 8.0, 2.0),
  ('gas', 60, NULL, 12.0, 2.0),
  ('water', 0, 10, 0.66, 0.1),
  ('water', 10, 20, 1.65, 0.1),
  ('water', 20, 30, 2.27, 0.1),
  ('water', 30, 40, 2.76, 0.1),
  ('water', 40, NULL, 3.00, 0.1);

-- 7. SCIENTIFIC DATA (Emission & Cost Factors)
CREATE TABLE IF NOT EXISTS public.scientific_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.scientific_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all" ON public.scientific_data;
CREATE POLICY "Enable read for all" ON public.scientific_data FOR SELECT USING (true);

INSERT INTO public.scientific_data (key, value) VALUES
  ('emission_factors', '{
    "car_petrol": 0.25,
    "car_diesel": 0.27,
    "bus": 0.08,
    "train": 0.04,
    "metro": 0.02,
    "food_veg": 2.0,
    "food_meat": 15.0,
    "food_mixed": 5.0,
    "flight_short": 0.15,
    "flight_long": 0.12,
    "transport_cost_per_km": 15,
    "food_cost_per_kg": 120,
    "shopping_fashion": 10,
    "shopping_electronics": 50,
    "shopping_generic": 5,
    "shopping_cost_per_item": 300
  }') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 8. USER COLUMNS SYNC
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'green_coins') THEN
    ALTER TABLE public.users ADD COLUMN green_coins INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'points') THEN
    ALTER TABLE public.users ADD COLUMN points INTEGER DEFAULT 0;
  END IF;
END $$;

-- 9. RELOAD SCHEMA
SELECT pg_notify('pgrst', 'reload schema');

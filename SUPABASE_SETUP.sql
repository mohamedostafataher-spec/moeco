-- COMPREHENSIVE SUPABASE SETUP 2026 - FINAL STABLE VERSION
-- This script initializes the database schema, security policies, and initial data.

-- 0. Cleanup (WARNING: This deletes existing data)
DROP TABLE IF EXISTS public.daily_checkins CASCADE;
DROP TABLE IF EXISTS public.utility_readings CASCADE;
DROP TABLE IF EXISTS public.utility_meters CASCADE;
DROP TABLE IF EXISTS public.consumption_records CASCADE;
DROP TABLE IF EXISTS public.carbon_footprint_logs CASCADE;
DROP TABLE IF EXISTS public.points_transactions CASCADE;
DROP TABLE IF EXISTS public.user_missions CASCADE;
DROP TABLE IF EXISTS public.missions CASCADE;
DROP TABLE IF EXISTS public.scientific_data CASCADE;
DROP TABLE IF EXISTS public.utility_tiers CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.news CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Users Profile (Linked to Supabase Auth)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    governorate TEXT,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    green_coins INTEGER DEFAULT 0,
    role TEXT DEFAULT 'citizen',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role, governorate)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مواطن مصري'),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id,
    'citizen',
    new.raw_user_meta_data->>'governorate'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Consumption Records (Source of Truth)
CREATE TABLE public.consumption_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sector TEXT NOT NULL, -- electricity, water, gas, transport, food
    value FLOAT8 NOT NULL,
    unit TEXT,
    carbon_impact FLOAT8 DEFAULT 0, -- KG CO2
    cost FLOAT8 DEFAULT 0, -- EGP
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Carbon Footprint Logs (History)
CREATE TABLE public.carbon_footprint_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    transport_emissions FLOAT8 DEFAULT 0,
    electricity_emissions FLOAT8 DEFAULT 0,
    gas_emissions FLOAT8 DEFAULT 0,
    water_emissions FLOAT8 DEFAULT 0,
    food_emissions FLOAT8 DEFAULT 0,
    shopping_emissions FLOAT8 DEFAULT 0,
    total_emissions FLOAT8 DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Scientific Data (Factors)
CREATE TABLE public.scientific_data (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    category TEXT,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Utility Tiers (Egypt 2026 Official)
CREATE TABLE public.utility_tiers (
    id SERIAL PRIMARY KEY,
    sector TEXT NOT NULL,
    min FLOAT8,
    max FLOAT8,
    price FLOAT8,
    carbon_factor FLOAT8,
    unit TEXT,
    fixed_fee FLOAT8 DEFAULT 0
);

-- 7. Utility Meters
CREATE TABLE public.utility_meters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- electricity, water, gas
    meter_number TEXT,
    initial_reading FLOAT8 DEFAULT 0,
    is_estimated BOOLEAN DEFAULT FALSE,
    estimation_method TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Utility Readings
CREATE TABLE public.utility_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meter_id UUID REFERENCES public.utility_meters(id) ON DELETE CASCADE,
    reading_date DATE DEFAULT CURRENT_DATE,
    reading_value FLOAT8 NOT NULL,
    consumption FLOAT8 NOT NULL,
    cost FLOAT8 DEFAULT 0,
    co2_impact FLOAT8 DEFAULT 0,
    photo_url TEXT,
    status TEXT DEFAULT 'Actual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Daily Utility Readings (Granular self-tracking)
CREATE TABLE public.daily_utility_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meter_id UUID REFERENCES public.utility_meters(id) ON DELETE CASCADE,
    reading_date DATE DEFAULT CURRENT_DATE,
    reading_value FLOAT8 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, meter_id, reading_date)
);

-- 10. Missions
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    category TEXT,
    points_reward INTEGER DEFAULT 0,
    coins_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS points_reward INTEGER DEFAULT 0;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS coins_reward INTEGER DEFAULT 0;

-- 11. User Missions (Completed)
CREATE TABLE public.user_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    proof_url TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, mission_id)
);

-- 12. Points Transactions
CREATE TABLE public.points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Daily Checkins
CREATE TABLE public.daily_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    checkin_date DATE DEFAULT CURRENT_DATE,
    points_awarded INTEGER DEFAULT 10,
    streak_day INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, checkin_date)
);

-- 14. News & Updates
CREATE TABLE public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    content_ar TEXT,
    content_en TEXT,
    image_url TEXT,
    category TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Environmental Reports
CREATE TABLE public.environmental_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT, -- trash, water_leak, energy_waste, etc.
    photo_url TEXT,
    location_lat FLOAT8,
    location_lng FLOAT8,
    status TEXT DEFAULT 'Pending', -- Pending, Investigating, Resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Water Issues (Specialized tracking)
CREATE TABLE public.water_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT,
    description TEXT,
    location_lat FLOAT8,
    location_lng FLOAT8,
    severity TEXT,
    status TEXT DEFAULT 'Open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Challenges
CREATE TABLE public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    category TEXT,
    target_value FLOAT8,
    condition_type TEXT, -- carbon_saved, water_saved, trees_planted
    reward_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. User Challenges
CREATE TABLE public.user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    progress FLOAT8 DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- 19. Gov Bills (Simulated integration)
CREATE TABLE public.gov_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bill_type TEXT, -- Electricity, Water, Gas
    amount FLOAT8 NOT NULL,
    consumption_value FLOAT8,
    due_date DATE,
    status TEXT DEFAULT 'Unpaid',
    payment_method TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. Legacy Rewards Logs (To prevent errors in old code)
CREATE VIEW public.rewards_logs AS 
SELECT id, user_id, points, reason as action, (metadata->>'source') as source, created_at 
FROM public.points_transactions;

-- 8. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_footprint_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scientific_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_utility_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gov_bills ENABLE ROW LEVEL SECURITY;

-- 9. Policies
CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users Update Own Profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users Insert Profile" ON public.users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users Manage Own Consumption" ON public.consumption_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users Manage Own Logs" ON public.carbon_footprint_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users Manage Own Meters" ON public.utility_meters FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users Manage Own Readings" ON public.utility_readings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users Manage Own Daily Readings" ON public.daily_utility_readings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users Read Own Checkins" ON public.daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users Read Own Missions" ON public.user_missions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public Read Scientific Data" ON public.scientific_data FOR SELECT USING (true);
CREATE POLICY "Public Read Utility Tiers" ON public.utility_tiers FOR SELECT USING (true);
CREATE POLICY "Public Read Missions" ON public.missions FOR SELECT USING (true);
CREATE POLICY "Public Read News" ON public.news FOR SELECT USING (true);

CREATE POLICY "Users Manage Own Reports" ON public.environmental_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users Manage Own Water Issues" ON public.water_issues FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public Read Challenges" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Users Manage Own Challenges" ON public.user_challenges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users Read Own Bills" ON public.gov_bills FOR SELECT USING (auth.uid() = user_id);

-- 10. Initial Data (FULL EDITIONS)
INSERT INTO public.utility_tiers (sector, min, max, price, carbon_factor, unit, fixed_fee) VALUES
-- Electricity Residential
('electricity', 0, 50, 0.68, 0.527, 'kWh', 1),
('electricity', 51, 100, 0.78, 0.527, 'kWh', 2),
('electricity', 0, 200, 0.95, 0.527, 'kWh', 6),
('electricity', 201, 350, 1.36, 0.527, 'kWh', 11),
('electricity', 351, 650, 1.95, 0.527, 'kWh', 15),
('electricity', 0, 1000, 2.10, 0.527, 'kWh', 25),
('electricity', 1001, 99999, 2.23, 0.527, 'kWh', 40),
-- Water Residential
('water', 0, 10, 2.00, 0.342, 'm3', 0),
('water', 11, 20, 3.10, 0.342, 'm3', 0),
('water', 21, 30, 5.00, 0.342, 'm3', 0),
('water', 31, 40, 8.00, 0.342, 'm3', 0),
('water', 41, 99999, 10.00, 0.342, 'm3', 0),
-- Gas Residential
('gas', 0, 30, 6.00, 2.02, 'm3', 0),
('gas', 31, 60, 8.00, 2.02, 'm3', 0),
('gas', 61, 99999, 12.00, 2.02, 'm3', 0);

INSERT INTO public.scientific_data (key, category, value) VALUES
('emission_factors', 'environmental', '{
    "electricity": 0.527,
    "water": 0.342,
    "gas": 2.02,
    "benzin": 2.31,
    "diesel": 2.68,
    "car_small": 0.12,
    "car_large": 0.25,
    "bus": 0.092,
    "food_meat": 12.5,
    "food_veg": 0.8
}'::jsonb);

-- 11. Initial Missions
INSERT INTO public.missions (title_ar, title_en, category, points_reward, coins_reward) VALUES
('قلل استهلاك الكهرباء 10%', 'Reduce Electricity 10%', 'utilities', 50, 10),
('استخدم المواصلات العامة', 'Use Public Transit', 'transport', 30, 5),
('سجل قراءة العداد اليوم', 'Log Meter Reading', 'utilities', 20, 2),
('قلل استهلاك المياه', 'Save Water', 'utilities', 40, 8);

-- End of Setup

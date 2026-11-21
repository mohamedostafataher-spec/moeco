-- MO ECO Database Clean Rebuild Script
-- This script handles duplicate data by dropping existing tables and recreating them with the correct schema.
-- Use this to reset the database state or fix schema inconsistencies.

-- 1. Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS traffic_reports CASCADE;
DROP TABLE IF EXISTS walking_activities CASCADE;
DROP TABLE IF EXISTS rideshares CASCADE;
DROP TABLE IF EXISTS transport_logs CASCADE;
DROP TABLE IF EXISTS carbon_activities CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS health_facilities CASCADE;
DROP TABLE IF EXISTS emergency_reports CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;

-- 2. Create Tables

-- User Profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  points INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carbon Activities
CREATE TABLE carbon_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'electricity', 'water', 'gas', 'transport', 'food', 'shopping'
  sub_type TEXT,
  amount FLOAT NOT NULL,
  carbon_footprint FLOAT NOT NULL, -- in kg CO2
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transport Logs
CREATE TABLE transport_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL, -- 'metro', 'bus', 'train', 'car', 'walking', 'cycling'
  distance_km FLOAT NOT NULL,
  duration_minutes INTEGER,
  origin TEXT,
  destination TEXT,
  co2_saved FLOAT,
  cost FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rideshares
CREATE TABLE rideshares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  seats_available INTEGER NOT NULL,
  price_per_seat FLOAT,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Walking Activities
CREATE TABLE walking_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  steps INTEGER,
  distance_km FLOAT,
  duration_seconds INTEGER,
  points_earned INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Traffic Reports
CREATE TABLE traffic_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'jam', 'accident', 'hazard', 'police'
  description TEXT,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Reports
CREATE TABLE emergency_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  location TEXT,
  severity TEXT, -- 'Low', 'Medium', 'High', 'Critical'
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_amount FLOAT,
  discount_type TEXT, -- 'percentage', 'fixed'
  expiry_date TIMESTAMP WITH TIME ZONE,
  partner_name TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rideshares ENABLE ROW LEVEL SECURITY;
ALTER TABLE walking_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies

-- User Profiles: Users can read/write their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Carbon Activities: Users can read/write their own activities
CREATE POLICY "Users can view own carbon activities" ON carbon_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own carbon activities" ON carbon_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transport Logs: Users can read/write their own logs
CREATE POLICY "Users can view own transport logs" ON transport_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transport logs" ON transport_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Rideshares: Everyone can view active rides, only drivers can manage their own
CREATE POLICY "Anyone can view active rideshares" ON rideshares FOR SELECT USING (status = 'active');
CREATE POLICY "Drivers can manage own rideshares" ON rideshares FOR ALL USING (auth.uid() = driver_id);

-- Traffic Reports: Everyone can view, authenticated users can insert
CREATE POLICY "Anyone can view traffic reports" ON traffic_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert traffic reports" ON traffic_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Coupons: Everyone can view
CREATE POLICY "Anyone can view coupons" ON coupons FOR SELECT USING (true);

-- 5. Insert Sample Data (Optional)
INSERT INTO coupons (code, title, description, discount_amount, discount_type, partner_name, category)
VALUES 
('ECO10', '10% Off Organic Food', 'Get 10% off at Green Market', 10, 'percentage', 'Green Market', 'Food'),
('METRO5', '5 EGP Metro Credit', 'Free credit for your next metro trip', 5, 'fixed', 'Cairo Metro', 'Transport'),
('SOLAR20', '20% Off Solar Panels', 'Discount on residential solar installation', 20, 'percentage', 'SunPower Egypt', 'Energy');

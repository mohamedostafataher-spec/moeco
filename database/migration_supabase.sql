-- Migration script for MoEco Application
-- Run this in your Supabase SQL Editor

-- 1. Users table (Primary profile table)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  green_coins INTEGER DEFAULT 0,
  governorate TEXT,
  streak_count INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  role TEXT DEFAULT 'user', -- user, admin, moderator
  family_id UUID, -- References a potential families table
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Carbon Footprint Logs
CREATE TABLE IF NOT EXISTS public.carbon_footprint_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  transport_emissions FLOAT DEFAULT 0,
  electricity_emissions FLOAT DEFAULT 0,
  gas_emissions FLOAT DEFAULT 0,
  water_emissions FLOAT DEFAULT 0,
  total_emissions FLOAT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Transport Emissions
CREATE TABLE IF NOT EXISTS public.transport_emissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  transport_type TEXT NOT NULL, -- car, bus, metro, etc.
  distance_km FLOAT NOT NULL,
  co2_emissions FLOAT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Walking Sessions
CREATE TABLE IF NOT EXISTS public.walking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  distance_km FLOAT NOT NULL,
  co2_saved_kg FLOAT NOT NULL,
  green_tokens INTEGER DEFAULT 0
);

-- 5. News
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  url TEXT,
  image_url TEXT,
  target_screen TEXT DEFAULT 'eco_news', -- eco_news, emergency, transport
  priority TEXT DEFAULT 'normal', -- normal, urgent
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RSS Sources
CREATE TABLE IF NOT EXISTS public.rss_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category_id TEXT,
  target_screen TEXT DEFAULT 'eco_news',
  priority_keywords TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- 7. Emergency Alerts Log (Updated Table Name as per req)
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID REFERENCES public.news(id),
  alert_triggered_at TIMESTAMPTZ DEFAULT NOW(),
  users_notified INTEGER DEFAULT 0
);

-- 8. Gov Services
CREATE TABLE IF NOT EXISTS public.gov_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  category_ar TEXT,
  description TEXT,
  url TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- 9. Carpool Rides (Suggested)
CREATE TABLE IF NOT EXISTS public.carpool_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.users(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  seats_available INTEGER NOT NULL,
  price_per_seat FLOAT DEFAULT 0,
  status TEXT DEFAULT 'available'
);

-- 10. Transport Lines (Suggested)
CREATE TABLE IF NOT EXISTS public.transport_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_name TEXT NOT NULL,
  transport_type TEXT NOT NULL, -- metro, bus, microbus
  route_data JSONB, -- list of stations/stops
  is_active BOOLEAN DEFAULT TRUE
);

-- RLS RULES (Basic patterns)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.carbon_footprint_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own logs" ON public.carbon_footprint_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own logs" ON public.carbon_footprint_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Apply similar RLS to other user-specific tables...
ALTER TABLE public.transport_emissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own transport logs" ON public.transport_emissions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.walking_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own walking sessions" ON public.walking_sessions FOR ALL USING (auth.uid() = user_id);

-- News should be readable by all
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read news" ON public.news FOR SELECT USING (true);

ALTER TABLE public.gov_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read gov services" ON public.gov_services FOR SELECT USING (true);

-- 11. Legacy/Consolidated Activities (Still used by several components)
CREATE TABLE IF NOT EXISTS public.carbon_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  activity_type TEXT,
  sector TEXT DEFAULT 'general',
  value FLOAT,
  carbon_impact FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.carbon_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own carbon activities" ON public.carbon_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own carbon activities" ON public.carbon_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

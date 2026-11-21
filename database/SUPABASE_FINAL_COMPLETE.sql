
-- ==========================================
-- MO ECO SUPABASE MASTER SCHEMA V3
-- ==========================================
-- Optimized for Egyptian Environment & Real-time Data
-- Cleans up existing structures and enforces strict consistency.

-- 0. CLEANUP (Careful Drop Order)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.walking_activities CASCADE;
DROP TABLE IF EXISTS public.rideshares CASCADE;
DROP TABLE IF EXISTS public.traffic_reports CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.scientific_data CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.user_missions CASCADE;
DROP TABLE IF EXISTS public.daily_missions CASCADE;
DROP TABLE IF EXISTS public.community_members CASCADE;
DROP TABLE IF EXISTS public.transport_logs CASCADE;
DROP TABLE IF EXISTS public.gov_services CASCADE;
DROP TABLE IF EXISTS public.eco_products CASCADE;
DROP TABLE IF EXISTS public.food_items CASCADE;
DROP TABLE IF EXISTS public.commodity_prices CASCADE;
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.carbon_activities CASCADE;
DROP TABLE IF EXISTS public.news_articles CASCADE;
DROP TABLE IF EXISTS public.rss_feeds CASCADE;
DROP TABLE IF EXISTS public.cities CASCADE;
DROP TABLE IF EXISTS public.governorates CASCADE;
DROP TABLE IF EXISTS public.countries CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. LOCATIONS (Baseline for users)
CREATE TABLE public.countries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL UNIQUE,
    code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.governorates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    safety_index INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    governorate_id UUID REFERENCES public.governorates(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES (Master User Table)
CREATE TABLE public.profiles (
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
    social_bracket TEXT DEFAULT 'middle',
    
    country_id UUID REFERENCES public.countries(id),
    governorate_id UUID REFERENCES public.governorates(id),
    city_id UUID REFERENCES public.cities(id),
    
    country_name TEXT,
    governorate_name TEXT,
    city_name TEXT,
    
    language TEXT DEFAULT 'ar',
    theme TEXT DEFAULT 'light',
    role TEXT DEFAULT 'citizen',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "System can insert profiles." ON public.profiles FOR INSERT WITH CHECK (true);

-- 3. AUTO-PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    full_name, 
    avatar_url,
    country_id,
    governorate_id,
    city_id,
    country_name,
    governorate_name,
    city_name,
    social_bracket,
    role
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'country_id')::uuid,
    (new.raw_user_meta_data->>'governorate_id')::uuid,
    (new.raw_user_meta_data->>'city_id')::uuid,
    new.raw_user_meta_data->>'country_name',
    new.raw_user_meta_data->>'governorate_name',
    new.raw_user_meta_data->>'city_name',
    COALESCE(new.raw_user_meta_data->>'social_bracket', 'middle'),
    COALESCE(new.raw_user_meta_data->>'role', 'citizen')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. GOV SERVICES (Fixing missing is_active)
CREATE TABLE public.gov_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    category TEXT,
    description_en TEXT,
    description_ar TEXT,
    url TEXT UNIQUE,
    source TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_smart BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ALERTS & EMERGENCY
CREATE TABLE public.alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT,
    severity TEXT CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    location TEXT,
    lat FLOAT,
    lng FLOAT,
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONTENT & RSS
CREATE TABLE public.rss_feeds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    last_fetch TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.news_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feed_id UUID REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    link TEXT UNIQUE,
    image_url TEXT,
    source TEXT,
    category TEXT,
    published_at TIMESTAMPTZ,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CARBON & BILLS
CREATE TABLE public.carbon_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'transport', 'electricity', 'water', 'gas', 'food', 'shopping'
    sector TEXT NOT NULL,
    value NUMERIC DEFAULT 0,
    carbon_impact NUMERIC DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.carbon_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own carbon activities." ON public.carbon_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own carbon activities." ON public.carbon_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sector TEXT NOT NULL, -- 'electricity', 'water', 'gas'
    previous_reading NUMERIC,
    current_reading NUMERIC,
    consumption NUMERIC,
    bill_amount NUMERIC,
    tier INTEGER,
    carbon_footprint NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bills." ON public.bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bills." ON public.bills FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. COMMUNITY & GAMIFICATION
CREATE TABLE public.community_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    role TEXT DEFAULT 'member',
    status TEXT DEFAULT 'active',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.daily_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    points INTEGER DEFAULT 10,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES public.daily_missions(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    code TEXT UNIQUE,
    discount_value TEXT,
    provider TEXT,
    category TEXT,
    points_cost INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SPORTS & EVENTS (Matches Sync)
CREATE TABLE public.matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_a TEXT,
    team_b TEXT,
    score_a INTEGER DEFAULT 0,
    score_b INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'finished'
    start_time TIMESTAMPTZ,
    league TEXT,
    external_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ECONOMY & PRODUCTS
CREATE TABLE public.commodity_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product TEXT NOT NULL,
    price NUMERIC NOT NULL,
    unit TEXT,
    city TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.food_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_ar TEXT,
    name_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    category TEXT,
    image TEXT,
    carbon_score NUMERIC,
    rating NUMERIC,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feed initial data for countries
INSERT INTO public.countries (name_en, name_ar, code) VALUES ('Egypt', 'مصر', 'EG') ON CONFLICT DO NOTHING;

-- INDEXES for Performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_carbon_activities_user ON public.carbon_activities(user_id);
CREATE INDEX idx_gov_services_active ON public.gov_services(is_active);
CREATE INDEX idx_alerts_active ON public.alerts(is_active);
CREATE INDEX idx_news_published ON public.news_articles(published_at);

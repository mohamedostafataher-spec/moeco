-- MO ECO SUPABASE MASTER SCHEMA (FINAL CONSOLIDATED)
-- This script resets and creates the complete schema for the MO ECO application.

-- 0. CLEANUP (Delete existing tables to avoid duplicates)
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.scientific_data CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.user_missions CASCADE;
DROP TABLE IF EXISTS public.daily_missions CASCADE;
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

-- 1. PROFILES & AUTH
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    points INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    governorate TEXT,
    city TEXT,
    country TEXT DEFAULT 'Egypt',
    language TEXT DEFAULT 'ar',
    theme TEXT DEFAULT 'light',
    role TEXT DEFAULT 'user',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. LOCATIONS
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
    lat NUMERIC,
    lng NUMERIC,
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

-- 3. CONTENT (News & RSS)
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

-- 4. CARBON & UTILITIES
CREATE TABLE public.carbon_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
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

-- 5. ECONOMY & MARKET
CREATE TABLE public.commodity_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product TEXT NOT NULL,
    price NUMERIC NOT NULL,
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

CREATE TABLE public.eco_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    category TEXT,
    price TEXT,
    impact TEXT,
    image TEXT,
    rating NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GOV SERVICES & TRANSPORT
CREATE TABLE public.gov_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    category TEXT,
    description_en TEXT,
    description_ar TEXT,
    url TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.transport_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    origin TEXT,
    destination TEXT,
    distance_km NUMERIC,
    duration_minutes INTEGER,
    transport_type TEXT,
    carbon_footprint NUMERIC,
    cost NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. GAMIFICATION
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

-- 8. SYSTEM DATA
CREATE TABLE public.scientific_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_a TEXT,
    team_b TEXT,
    score_a INTEGER,
    score_b INTEGER,
    status TEXT,
    start_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email, new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_carbon_activities_user ON public.carbon_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user ON public.bills(user_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON public.news_articles(published_at);

-- ==========================================
-- MOECO FULL SUPABASE SCHEMA (FINAL COMPREHENSIVE)
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CORE IDENTITY & REFERENCE DATA
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    code TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS public.governorates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL
);

INSERT INTO public.countries (name_ar, name_en, code) VALUES ('مصر', 'Egypt', 'EG') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    avatar TEXT,
    governorate TEXT,
    city TEXT,
    role TEXT DEFAULT 'citizen',
    points INTEGER DEFAULT 0,
    green_coins INTEGER DEFAULT 0,
    experience_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_count INTEGER DEFAULT 0,
    family_id UUID,
    social_bracket TEXT,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    'citizen',
    100
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. SUSTAINABILITY & CARBON TRACKING
CREATE TABLE IF NOT EXISTS public.carbon_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    carbon_impact FLOAT NOT NULL,
    sector TEXT NOT NULL,
    activity_type TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consumption_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sector TEXT NOT NULL,
    value FLOAT NOT NULL,
    unit TEXT,
    cost FLOAT,
    co2_impact FLOAT,
    description TEXT,
    source TEXT DEFAULT 'Smart Calculator',
    metadata JSONB,
    record_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GOVERNMENT SERVICES
CREATE TABLE IF NOT EXISTS public.gov_services (
    id SERIAL PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT,
    description_ar TEXT,
    description_en TEXT,
    url TEXT,
    estimated_time TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    carbon_impact_kg FLOAT,
    iframe_compatible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_steps (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES public.gov_services(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_text_ar TEXT NOT NULL,
    step_text_en TEXT NOT NULL,
    required_documents TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSPORT HUB
CREATE TABLE IF NOT EXISTS public.transport_lines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    type TEXT, -- 'metro', 'monorail', 'bus'
    status TEXT DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transport_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transport_type TEXT NOT NULL,
    origin TEXT,
    destination TEXT,
    distance_km FLOAT,
    carbon_footprint FLOAT,
    cost FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GAMIFICATION & REWARDS
CREATE TABLE IF NOT EXISTS public.user_scores (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    total_score INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.points_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    target_value FLOAT,
    reward_points INTEGER,
    reward_coins INTEGER,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_challenges (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
    progress FLOAT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    PRIMARY KEY(user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon TEXT,
    condition_type TEXT,
    condition_value INTEGER
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(user_id, badge_id)
);

-- 7. NEWS & ALERTS
CREATE TABLE IF NOT EXISTS public.news (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    description TEXT,
    url TEXT,
    image_url TEXT,
    source TEXT,
    category TEXT,
    target_screen TEXT DEFAULT 'eco_news',
    is_alert BOOLEAN DEFAULT FALSE,
    alert_type TEXT DEFAULT 'normal',
    priority TEXT DEFAULT 'normal',
    country TEXT DEFAULT 'Global',
    lat FLOAT,
    lng FLOAT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rss_sources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    feed_url TEXT UNIQUE NOT NULL,
    category TEXT DEFAULT 'general',
    target_screen TEXT DEFAULT 'eco_news',
    priority_keywords TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert essential RSS sources for the platform to function properly
INSERT INTO public.rss_sources (name, feed_url, target_screen, category, is_active, priority_keywords) VALUES
('هيئة الأرصاد المصرية', 'https://www.youm7.com/rss/356', 'emergency', 'weather', true, ARRAY['تحذير', 'أمطار', 'عاصفة']),
('الجزيرة - عاجل', 'https://www.aljazeera.net/rss', 'emergency', 'alerts', true, ARRAY['عاجل', 'انفجار', 'طوارئ']),
('سكاي نيوز عربية - عاجل', 'https://www.skynewsarabia.com/feeds/rss/urgent.xml', 'emergency', 'alerts', true, ARRAY['عاجل', 'urgent', 'breaking']),
('اليوم السابع - حوادث', 'https://www.youm7.com/rss/203', 'emergency', 'alerts', true, ARRAY['حادث', 'تصادم', 'حريق']),
('بي بي سي عربي - أخبار العالم', 'https://feeds.bbci.co.uk/arabic/rss.xml', 'eco_news', 'general', true, NULL),
('العربية - علوم وتقنية', 'https://www.alarabiya.net/science-and-tech/rss', 'eco_news', 'technology', true, NULL),
('Global Disaster Alert (GDACS)', 'https://www.gdacs.org/xml/rss.xml', 'emergency', 'alerts', true, ARRAY['earthquake', 'flood', 'tsunami', 'disaster'])
ON CONFLICT (feed_url) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    message_ar TEXT,
    message_en TEXT,
    type TEXT, -- 'info', 'warning', 'emergency'
    governorate TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SMART CALCULATOR & UTILITIES
CREATE TABLE IF NOT EXISTS public.utility_tiers (
    id SERIAL PRIMARY KEY,
    sector TEXT NOT NULL,
    tier_name TEXT,
    min FLOAT DEFAULT 0,
    max FLOAT,
    price FLOAT,
    carbon_factor FLOAT DEFAULT 0.5,
    service_cost FLOAT DEFAULT 0
);

-- Insert sample pricing data (Egypt 2024/2025)
INSERT INTO public.utility_tiers (sector, min, max, price, carbon_factor) VALUES
('electricity', 0, 50, 0.68, 0.5),
('electricity', 50, 100, 0.78, 0.5),
('electricity', 100, 200, 0.95, 0.5),
('electricity', 200, 350, 1.55, 0.5),
('electricity', 350, 650, 1.95, 0.5),
('electricity', 650, 1000, 2.10, 0.5),
('electricity', 1000, 2000, 2.23, 0.5),
('electricity', 2000, 9999999, 2.58, 0.5),
('gas', 0, 30, 6, 2.0),
('gas', 30, 60, 8, 2.0),
('gas', 60, 9999999, 12, 2.0),
('water', 0, 10, 0.66, 0.1),
('water', 10, 20, 1.65, 0.1),
('water', 20, 30, 2.27, 0.1),
('water', 30, 40, 2.76, 0.1),
('water', 40, 9999999, 3.00, 0.1)
ON CONFLICT (id) DO NOTHING;

-- 10. SCIENTIFIC DATA (Calculators)
CREATE TABLE IF NOT EXISTS public.scientific_data (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.scientific_data (key, value) VALUES ('emission_factors', '{
    "car_petrol": 0.22,
    "car_diesel": 0.24,
    "car_hybrid": 0.12,
    "car_electric": 0.05,
    "bus": 0.08,
    "metro": 0.04,
    "walking": 0,
    "cycling": 0,
    "food_meat": 2.5,
    "food_veg": 0.4
}') ON CONFLICT (key) DO NOTHING;

-- 11. SUPPORT & LOGGING
CREATE TABLE IF NOT EXISTS public.error_logs (
    id SERIAL PRIMARY KEY,
    message TEXT,
    stack TEXT,
    screen TEXT,
    user_email TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_config (
    id SERIAL PRIMARY KEY,
    config_key TEXT UNIQUE NOT NULL,
    config_value JSONB,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_strings (
    id SERIAL PRIMARY KEY,
    string_key TEXT UNIQUE NOT NULL,
    ar TEXT,
    en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert dummy config to prevent empty object crashes
INSERT INTO public.app_config (config_key, config_value) VALUES 
('global_theme', '{"maintenance_mode": false, "primary_color": "#10b981"}')
ON CONFLICT (config_key) DO NOTHING;

-- 12. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.increment_service_usage(service_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.gov_services
    SET usage_count = usage_count + 1
    WHERE id = service_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_points(user_id_param UUID, amount_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET points = points + amount_param,
        experience_points = experience_points + (amount_param * 10)
    WHERE id = user_id_param;

    INSERT INTO public.points_transactions (user_id, amount, reason, category)
    VALUES (user_id_param, amount_param, 'RPC Increment', 'system');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_points(user_id_param UUID, amount_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET points = points - amount_param
    WHERE id = user_id_param AND points >= amount_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. RLS POLICIES (Simplified)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can edit their own profile" ON public.profiles;
CREATE POLICY "Users can edit their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- END OF SCHEMA
-- ==========================================

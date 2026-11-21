-- ===============================================================
-- MIGRATE_ALL_DATA.sql
-- ===============================================================

-- 1. Fix Challenges Schema
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS title_ar TEXT,
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- 2. Create tables for Digital Neighbor and community features if they don't exist
CREATE TABLE IF NOT EXISTS public.neighborhood_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT,
    title_ar TEXT,
    title_en TEXT,
    type TEXT DEFAULT 'Request',
    reward INTEGER DEFAULT 50,
    distance TEXT DEFAULT '100m',
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emergency_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    governorate TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gameyas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id),
    name TEXT,
    monthly_amount DECIMAL,
    duration_months INTEGER,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.street_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id),
    title_ar TEXT,
    title_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    progress INTEGER DEFAULT 0,
    goal TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Seed initial data for Country/Gov/Scientific (The "Transfer Data")
INSERT INTO public.countries (name_ar, name_en)
VALUES 
('مصر', 'Egypt'),
('السعودية', 'Saudi Arabia'),
('الإمارات', 'UAE')
ON CONFLICT (name_en) DO NOTHING;

INSERT INTO public.governorates (name_ar, name_en, country_en)
VALUES 
('القاهرة', 'Cairo', 'Egypt'),
('الجيزة', 'Giza', 'Egypt'),
('الإسكندرية', 'Alexandria', 'Egypt')
ON CONFLICT (name_en) DO NOTHING;

-- Seed challenges
INSERT INTO public.challenges (title_ar, title_en, description_ar, description_en, target_value, reward_points, category, condition_type)
VALUES 
('تحدي المشي اليومي', 'Daily Walking Challenge', 'امشِ 5000 خطوة اليوم', 'Walk 5000 steps today', 5000, 100, 'Health', 'steps'),
('موفر الطاقة', 'Energy Saver', 'قلل استهلاك الكهرباء بنسبة 10%', 'Reduce electricity by 10%', 10, 200, 'Energy', 'reduction')
ON CONFLICT DO NOTHING;

-- Seed neighborhood requests
INSERT INTO public.neighborhood_requests (user_name, title_ar, title_en, type, reward, distance)
VALUES 
('أحمد محمد', 'مساعدة في تسوق البقالة', 'Help with grocery shopping', 'Request', 50, '200m'),
('سارة علي', 'تعليم زراعة الأسطح', 'Teaching rooftop gardening', 'Offer', 100, '500m')
ON CONFLICT DO NOTHING;

-- Seed Gameyas
INSERT INTO public.gameyas (name, monthly_amount, duration_months)
VALUES 
('جمعية التوفير الأخضر', 1000, 10),
('جمعية جيران المعادي', 2000, 12)
ON CONFLICT DO NOTHING;

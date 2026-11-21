-- ========================================================
-- MOECO MASTER DATABASE SYNC & REPAIR SCRIPT 2024 V4
-- (SAFE MODE: No complex regex to prevent Supabase UI crashes)
-- ========================================================

-- 1. إصلاح جدول gov_services (إضافة الأعمدة المفقودة)
ALTER TABLE IF EXISTS public.gov_services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS public.gov_services ADD COLUMN IF NOT EXISTS is_smart BOOLEAN DEFAULT FALSE;

-- 2. التأكد من وجود الجداول الأساسية
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL UNIQUE,
    code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.governorates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    safety_index INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    governorate_id UUID REFERENCES public.governorates(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. إصلاح جدول Profiles (إضافة الأعمدة الجديدة إجبارياً إن كانت ناقصة)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS green_coins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_bracket TEXT DEFAULT 'middle';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES public.countries(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS governorate_id UUID REFERENCES public.governorates(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS governorate_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'citizen';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- تفعيل الأمان (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- حذف سياسات الأمان القديمة المعطوبة
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile during registration" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles during auth" ON public.profiles;

-- إنشاء سياسات الأمان السليمة
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "System can insert profiles during auth" ON public.profiles FOR INSERT WITH CHECK (true);

-- 4. إزالة وإنشاء محرك التسجيل للربط التلقائي وإصلاح أخطاء التسجيل (نسخة آمنة بدون تعبيرات معقدة)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    full_name,
    country_name,
    governorate_name,
    city_name,
    social_bracket,
    avatar_url
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    new.raw_user_meta_data->>'country_name',
    new.raw_user_meta_data->>'governorate_name',
    new.raw_user_meta_data->>'city_name',
    COALESCE(new.raw_user_meta_data->>'social_bracket', 'middle'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. إصلاح الجداول الحيوية بقوة لتلافي أي أعمدة ناقصة
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY
);
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Alert';
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS severity TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.news_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY
);
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'News';
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- إنشاء الفهارس (Indexes) لدعم سرعة البحث
CREATE INDEX IF NOT EXISTS idx_news_link ON public.news_articles(link);
CREATE INDEX IF NOT EXISTS idx_alerts_title ON public.alerts(title);

-- التأكد من وجود البيانات الأساسية (مصر)
INSERT INTO public.countries (name_en, name_ar, code) 
VALUES ('Egypt', 'مصر', 'EG') 
ON CONFLICT (name_en) DO NOTHING;

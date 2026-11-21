-- MO ECO SUPABASE MIGRATION V2
-- Enhancing for Centralized Control & Egyptian Coupons

-- 1. APP CONFIGURATION (Design, Colors, Fonts)
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key TEXT UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial Config
INSERT INTO public.app_config (config_key, config_value, description)
VALUES ('global_theme', '{
    "primary_color": "#C5A059",
    "secondary_color": "#000000",
    "font_family": "Cairo",
    "dark_mode_enabled": true,
    "maintenance_mode": false,
    "announcement": "مرحباً بكم في MO ECO 2026 - النسخة الذكية"
}', 'Global App Theme and Status')
ON CONFLICT (config_key) DO NOTHING;

-- 2. APP STRINGS (Localization & Dynamic Text)
CREATE TABLE IF NOT EXISTS public.app_strings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    string_key TEXT UNIQUE NOT NULL,
    ar TEXT NOT NULL,
    en TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. NOTIFICATIONS HISTORY
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for global
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    body_ar TEXT NOT NULL,
    body_en TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USER FAVORITES
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    item_type TEXT NOT NULL, -- 'coupon', 'news'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id, item_type)
);

-- 5. ENHANCE COUPONS
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS terms_ar TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS terms_en TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; -- 'active', 'expired'

-- 6. RLS POLICIES
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App config is viewable by everyone." ON public.app_config FOR SELECT USING (true);

ALTER TABLE public.app_strings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App strings are viewable by everyone." ON public.app_strings FOR SELECT USING (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own favorites." ON public.user_favorites FOR ALL USING (auth.uid() = user_id);

-- 7. FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON public.app_config FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_app_strings_updated_at BEFORE UPDATE ON public.app_strings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

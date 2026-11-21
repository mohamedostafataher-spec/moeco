-- 🚀 MOECO ULTRA ADMIN DASHBOARD SQL SETUP
-- This script prepares the database for advanced real-time control

-- 1. Governance & Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY,
    category TEXT DEFAULT 'general',
    settings_data JSONB DEFAULT '{}'::jsonb,
    label TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Enhanced Pricing System (Supporting Tiers and Segments)
CREATE TABLE IF NOT EXISTS public.utility_tariffs (
    id SERIAL PRIMARY KEY,
    utility_type TEXT NOT NULL, -- 'electricity', 'water', 'gas', 'fuel'
    segment_name TEXT NOT NULL, -- 'Residential', 'Commercial', 'Industrial'
    tier_min NUMERIC NOT NULL DEFAULT 0,
    tier_max NUMERIC,
    price_per_unit NUMERIC NOT NULL,
    emission_factor NUMERIC DEFAULT 0, -- Factor for this specific tier
    unit TEXT DEFAULT 'kWh',
    governorate TEXT DEFAULT 'All',
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. National Metrics (Cache for Dashboard Speed)
CREATE TABLE IF NOT EXISTS public.national_metrics (
    id SERIAL PRIMARY KEY,
    metric_key TEXT UNIQUE,
    metric_value NUMERIC,
    metric_data JSONB DEFAULT '{}'::jsonb,
    category TEXT, -- 'emissions', 'consumption', 'savings'
    governorate TEXT DEFAULT 'National',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Audit Engine
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    target_table TEXT,
    target_id TEXT,
    previous_data JSONB,
    new_data JSONB,
    severity TEXT DEFAULT 'info',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Governorate Profiles
CREATE TABLE IF NOT EXISTS public.governorates (
    id SERIAL PRIMARY KEY,
    name_en TEXT UNIQUE,
    name_ar TEXT,
    population BIGINT,
    target_emission_reduction NUMERIC DEFAULT 10, -- percentage
    current_efficiency_score NUMERIC DEFAULT 0,
    heat_map_index NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed basic governorates if empty
INSERT INTO public.governorates (name_en, name_ar)
SELECT * FROM (VALUES 
    ('Cairo', 'القاهرة'), ('Giza', 'الجيزة'), ('Alexandria', 'الإسكندرية'), 
    ('Suez', 'السويس'), ('Port Said', 'بورسعيد'), ('Luxor', 'الأقصر'),
    ('Aswan', 'أسوان'), ('Sohag', 'سوهاج'), ('Qena', 'قنا'), ('Assiut', 'أسيوط')
) AS v(e, a)
WHERE NOT EXISTS (SELECT 1 FROM public.governorates LIMIT 1);

-- 6. Enable Realtime for key tables
-- We handle this via UI in Supabase, but for instructions we'll mention it or use SQL if possible
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.utility_tariffs;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.national_metrics;

-- 7. RLS - Admins can do everything
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.national_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governorates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage app_settings" ON public.app_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gov_admin'))
);
CREATE POLICY "Public can view app_settings" ON public.app_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage utility_tariffs" ON public.utility_tariffs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gov_admin'))
);
CREATE POLICY "Public can view utility_tariffs" ON public.utility_tariffs FOR SELECT USING (true);

CREATE POLICY "Admins can manage governorates" ON public.governorates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gov_admin'))
);
CREATE POLICY "Public can view governorates" ON public.governorates FOR SELECT USING (true);

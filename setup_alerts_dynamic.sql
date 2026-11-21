-- ============================================
-- MOECO ALERTS & EMERGENCY DATABASE SETUP
-- ============================================

-- 1. Create Emergency Contacts Table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    number TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Populate Emergency Contacts
TRUNCATE TABLE public.emergency_contacts;
INSERT INTO public.emergency_contacts (name, number, description, icon) VALUES
('الإسعاف', '123', 'طوارئ الإسعاف والخدمات الطبية', 'Phone'),
('الشرطة', '122', 'النجدة والشرطة', 'ShieldCheck'),
('المطافئ', '180', 'الدفاع المدني والحرائق', 'Flame'),
('طوارئ الغاز', '129', 'بلاغات تسريب الغاز', 'Wind'),
('طوارئ الكهرباء', '121', 'بلاغات انقطاع الكهرباء', 'Zap'),
('طوارئ المياه', '125', 'بلاغات انقطاع المياه', 'Droplets');

-- 3. Ensure News Categories has 'alerts'
INSERT INTO public.news_categories (name, name_ar, icon, display_order, is_active)
VALUES ('alerts', 'إنذارات وطوارئ', 'AlertTriangle', 1, true)
ON CONFLICT (name) DO UPDATE SET is_active = true;

-- 4. Create Governorate Safety Index Table (if not exists)
CREATE TABLE IF NOT EXISTS public.governorates_safety_index (
    id SERIAL PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    safety_index INTEGER DEFAULT 100,
    risk_level TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name_en)
);

-- 5. Populate Safety Indices
INSERT INTO public.governorates_safety_index (name_ar, name_en, safety_index, risk_level) VALUES
('القاهرة', 'Cairo', 85, 'Low'),
('الإسكندرية', 'Alexandria', 82, 'Low'),
('الجيزة', 'Giza', 78, 'Low'),
('البحر الأحمر', 'Red Sea', 92, 'Safe'),
('أسيـوط', 'Assiut', 75, 'Moderate'),
('أسوان', 'Aswan', 89, 'Safe'),
('الأقصر', 'Luxor', 87, 'Safe'),
('بورسعيد', 'Port Said', 88, 'Safe'),
('السويس', 'Suez', 84, 'Low'),
('جنوب سيناء', 'South Sinai', 90, 'Safe')
ON CONFLICT (name_en) DO UPDATE SET 
  safety_index = EXCLUDED.safety_index,
  risk_level = EXCLUDED.risk_level,
  last_updated = NOW();

-- 6. Setup RSS Sources for Alerts
-- Fetch existing category ID
DO $$
DECLARE
    alerts_cat_id UUID;
BEGIN
    SELECT id INTO alerts_cat_id FROM public.news_categories WHERE name = 'alerts';

    IF alerts_cat_id IS NOT NULL THEN
        -- Insert working sources
        INSERT INTO public.rss_sources (name, url, category_id, is_active, priority_keywords) VALUES
        ('رئاسة مجلس الوزراء', 'https://rss.app/feeds/VwaSNUoJww07GhON.xml', alerts_cat_id, true, 'بيان, عاجل, طوارئ'),
        ('الأرصاد الجوية المصرية', 'https://rss.app/feeds/Qv9b3WuavwqJitNA.xml', alerts_cat_id, true, 'طقس, أمطار, رياح'),
        ('منظمة الصحة العالمية', 'https://www.who.int/feeds/entity/csr/don/en/rss.xml', alerts_cat_id, true, 'صحة, وباء, تحذير'),
        ('GDACS - مخاطر عالمية', 'https://www.gdacs.org/xml/rss.xml', alerts_cat_id, true, 'زلزال, فيضان, إعصار'),
        ('اليوم السابع - عاجل', 'https://rss.app/feeds/t7iRy0P5O5E3I0u9.xml', alerts_cat_id, true, 'عاجل, حادث, إنذار'),
        ('المصري اليوم - أخبار', 'https://rss.app/feeds/Vcl9nN1U8T6GvV7B.xml', alerts_cat_id, true, 'عاجل, هام'),
        ('وزارة الداخلية', 'https://rss.app/feeds/moi_egypt.xml', alerts_cat_id, true, 'أمن, مرور, تحذير'),
        ('سكاي نيوز - بيئة', 'https://www.skynewsarabia.com/rss/feeds/environment.xml', alerts_cat_id, true, 'بيئة, تغير, مناخ')
        ON CONFLICT (url) DO UPDATE SET 
          is_active = true,
          category_id = EXCLUDED.category_id;
    END IF;
END $$;

-- 7. Ensure Realtime is enabled for new tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'emergency_contacts') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_contacts;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'governorates_safety_index') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.governorates_safety_index;
    END IF;
END $$;

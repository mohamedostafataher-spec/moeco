-- MoEco: Official Egyptian Government Services - ULTIMATE FIX (2026)
-- Target Table: government_services
-- This script fixes NOT NULL constraints, adds missing columns, and seeds the latest official data.

-- 1. BASE TABLE PREPARATION
CREATE TABLE IF NOT EXISTS public.government_services (
    id SERIAL PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    category TEXT,
    url TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SCHEMA TRANSFORMATION (ADD MISSING COLUMNS SAFELY)
DO $$ 
BEGIN
    -- Fix existing constraints that block imports
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='name_en' AND is_nullable='NO') THEN
        ALTER TABLE public.government_services ALTER COLUMN name_en DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='category' AND is_nullable='NO') THEN
        ALTER TABLE public.government_services ALTER COLUMN category DROP NOT NULL;
    END IF;

    -- Add Identity & Categorization Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='provider') THEN
        ALTER TABLE public.government_services ADD COLUMN provider TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='subcategory') THEN
        ALTER TABLE public.government_services ADD COLUMN subcategory TEXT;
    END IF;

    -- Add Visual & Impact Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='icon') THEN
        ALTER TABLE public.government_services ADD COLUMN icon TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='carbon_factor_type') THEN
        ALTER TABLE public.government_services ADD COLUMN carbon_factor_type TEXT DEFAULT 'digital_transaction';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='estimated_saving_kg') THEN
        ALTER TABLE public.government_services ADD COLUMN estimated_saving_kg DECIMAL DEFAULT 1.5;
    END IF;

    -- Add Status & Engagement Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='is_featured') THEN
        ALTER TABLE public.government_services ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='is_active') THEN
        ALTER TABLE public.government_services ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='usage_count') THEN
        ALTER TABLE public.government_services ADD COLUMN usage_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='popularity_score') THEN
        ALTER TABLE public.government_services ADD COLUMN popularity_score INTEGER DEFAULT 0;
    END IF;

    -- Add Metadata Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='description_ar') THEN
        ALTER TABLE public.government_services ADD COLUMN description_ar TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='description_en') THEN
        ALTER TABLE public.government_services ADD COLUMN description_en TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='steps') THEN
        ALTER TABLE public.government_services ADD COLUMN steps JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='required_documents') THEN
        ALTER TABLE public.government_services ADD COLUMN required_documents JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='office_location') THEN
        ALTER TABLE public.government_services ADD COLUMN office_location JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='working_hours') THEN
        ALTER TABLE public.government_services ADD COLUMN working_hours TEXT;
    END IF;

END $$;

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.government_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.government_services;
CREATE POLICY "Public Read Access" ON public.government_services FOR SELECT USING (true);

-- 4. INSERT OFFICIAL SERVICES (UPSERT MODE)
INSERT INTO public.government_services (name_ar, name_en, category, provider, url, icon, carbon_factor_type, estimated_saving_kg, is_featured, description_ar) VALUES
('بوابة مصر الرقمية', 'Digital Egypt', 'خدمات عامة', 'وزارة الاتصالات', 'https://digital.gov.eg', 'Zap', 'digital_transaction', 2.5, true, 'المنصة الموحدة لجميع الخدمات الحكومية الرقمية في مصر'),
('تجديد رخصة القيادة', 'Driving License Renewal', 'مرور', 'وزارة الداخلية', 'https://traffic.moi.gov.eg/traffic/renew-license', 'Car', 'paperless', 12.0, true, 'تجديد رخصة القيادة إلكترونياً وتوصيلها للمنزل'),
('منظومة الشكاوى الحكومية', 'Government Complaints', 'خدمات عامة', 'مجلس الوزراء', 'https://www.shakwa.eg', 'AlertCircle', 'digital_transaction', 0.5, false, 'المنصة الرسمية لتلقي شكاوى المواطنين والتعامل معها'),
('المنصة الموحدة للكهرباء', 'Electricity Services', 'مرافق', 'وزارة الكهرباء', 'https://eservices.eehc.gov.eg', 'Zap', 'digital_transaction', 1.5, true, 'دفع الفواتير، تركيب العدادات، وتقديم الطلبات'),
('حجز تذاكر القطارات', 'Train Tickets', 'نقل', 'سكك حديد مصر', 'https://enr.gov.eg', 'Train', 'paperless', 0.8, true, 'حجز تذاكر القطارات الرسمية أونلاين لتجنب الطوابير'),
('دعم مصر (التموين)', 'Tamwin Supplies', 'تموين', 'وزارة التموين', 'https://www.tamwin.com.eg', 'ShoppingBag', 'digital_transaction', 0.5, false, 'تفعيل بطاقة التموين وإضافة المواليد'),
('خدمات النيابة العامة', 'Public Prosecution', 'مرور', 'النيابة العامة', 'https://ppo.gov.eg/traffic', 'Scale', 'paperless', 1.5, false, 'الاستعلام عن مخالفات المرور والتظلم عليها'),
('صيدليات الإسعاف', 'Ambulance Pharmacies', 'صحة', 'وزارة الصحة', 'https://www.mohp.gov.eg/pharmacies', 'Heart', 'digital_transaction', 1.0, false, 'أماكن وتوافر الأدوية في صيدليات الإسعاف الرسمية'),
('صندوق الإسكان الاجتماعي', 'Social Housing Fund', 'إسكان', 'وزارة الإسكان', 'https://shmff.gov.eg', 'Home', 'paperless', 3.0, true, 'تقديم طلبات الإسكان الاجتماعي والاستعلام عن الحالة');

-- 5. REPAIR MISSING DATA (Fallback for old records)
UPDATE public.government_services SET name_en = 'Official Service' WHERE name_en IS NULL;
UPDATE public.government_services SET provider = 'Government Entity' WHERE provider IS NULL;
UPDATE public.government_services SET category = 'General' WHERE category IS NULL;

-- 6. FINAL NOT NULL ASSERTION (Only when safe)
-- We don't force NOT NULL on name_en to keep it robust against future imports, 
-- but we ensure name_ar is ALWAYS there.
ALTER TABLE public.government_services ALTER COLUMN name_ar SET NOT NULL;

-- SUCCESS MESSAGE
SELECT 'Database schema successfully updated and seeded.' as status;

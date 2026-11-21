CREATE TABLE IF NOT EXISTS public.rss_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    feed_url TEXT UNIQUE NOT NULL,
    category TEXT DEFAULT 'general',
    target_screen TEXT DEFAULT 'eco_news',
    priority_keywords TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.rss_sources (name, feed_url, target_screen, category, is_active, priority_keywords) VALUES
('هيئة الأرصاد المصرية', 'https://www.youm7.com/rss/356', 'emergency', 'weather', true, ARRAY['تحذير', 'أمطار', 'عاصفة']),
('الجزيرة - عاجل', 'https://www.aljazeera.net/rss', 'emergency', 'alerts', true, ARRAY['عاجل', 'انفجار', 'طوارئ']),
('سكاي نيوز عربية - عاجل', 'https://www.skynewsarabia.com/feeds/rss/urgent.xml', 'emergency', 'alerts', true, ARRAY['عاجل', 'urgent', 'breaking']),
('اليوم السابع - حوادث', 'https://www.youm7.com/rss/203', 'emergency', 'alerts', true, ARRAY['حادث', 'تصادم', 'حريق']),
('بي بي سي عربي - أخبار العالم', 'https://feeds.bbci.co.uk/arabic/rss.xml', 'eco_news', 'general', true, NULL),
('العربية - علوم وتقنية', 'https://www.alarabiya.net/science-and-tech/rss', 'eco_news', 'technology', true, NULL),
('Global Disaster Alert (GDACS)', 'https://www.gdacs.org/xml/rss.xml', 'emergency', 'alerts', true, ARRAY['earthquake', 'flood', 'tsunami', 'disaster'])
ON CONFLICT (feed_url) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.gov_services (
    id SERIAL PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT,
    description_ar TEXT,
    description_en TEXT,
    url TEXT,
    icon TEXT,
    carbon_impact_kg FLOAT,
    estimated_time TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    iframe_compatible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.gov_services (name_ar, name_en, category, description_ar, description_en, icon, url, carbon_impact_kg) VALUES
('استكمال عداد كهرباء', 'Complete Electricity Meter', 'Utilities', 'خدمات الكهرباء', 'Electricity Services', 'Zap', 'https://digital.gov.eg/utilities/electricity-meter', 0.5),
('استعلام فاتورة الكهرباء', 'Electricity Bill Query', 'Utilities', 'استعلام ودفع الكهرباء', 'Query and Pay Electricity', 'Zap', 'https://digital.gov.eg/utilities/electricity-bill', 0.1),
('سداد فاتورة المياه', 'Pay Water Bill', 'Utilities', 'سداد فواتير المياه', 'Pay Water Bills', 'Droplets', 'https://digital.gov.eg/utilities/water-bill', 0.1),
('سداد فاتورة الغاز', 'Pay Gas Bill', 'Utilities', 'سداد فواتير الغاز', 'Pay Gas Bills', 'Flame', 'https://digital.gov.eg/utilities/gas-bill', 0.1),
('تفعيل بطاقة التموين', 'Activate Ration Card', 'Subsidy', 'خدمات وزارة التموين', 'Ministry of Supply Services', 'CreditCard', 'https://digital.gov.eg/supply/activate-card', 0.0),
('إصدار توكيل', 'Issue Power of Attorney', 'Documentation', 'خدمات الشهر العقاري', 'Real Estate Registry Services', 'FileText', 'https://digital.gov.eg/documentation/power-of-attorney', 0.02),
('طلب صورة رسمية', 'Official Copy Request', 'Documentation', 'خدمات الشهر العقاري', 'Real Estate Registry', 'FileText', 'https://digital.gov.eg/documentation/certified-copy', 0.02),
('بدل فاقد الرقم القومي', 'Replace National ID', 'Civil Status', 'خدمات السجل المدني', 'Civil Registry Services', 'IdCard', 'https://digital.gov.eg/civil/replace-id', 0.03),
('استخراج قيد ميلاد', 'Birth Certificate', 'Civil Status', 'خدمات السجل المدني', 'Civil Registry', 'FileText', 'https://digital.gov.eg/civil/birth-certificate', 0.03),
('الاستعلام عن المخالفات', 'Traffic Violations', 'Traffic', 'خدمات المرور', 'Traffic Services', 'Car', 'https://digital.gov.eg/traffic/violations', 0.0),
('تجديد رخصة المركبة', 'Renew Vehicle License', 'Traffic', 'خدمات المرور', 'Traffic', 'Car', 'https://digital.gov.eg/traffic/renew-license', 0.2),
('استخراج قيد تجاري', 'Commercial Registry Extract', 'Commercial Registry', 'خدمات السجل التجاري', 'Commercial Registry Services', 'Building2', 'https://digital.gov.eg/commercial/extract', 0.1),
('حجز موعد طبي', 'Book Medical Appointment', 'Health', 'خدمات وزارة الصحة', 'Ministry of Health Services', 'Activity', 'https://digital.gov.eg/health/book-appointment', 0.01),
('نتيجة الثانوية العامة', 'High School Result', 'Education', 'وزارة التربية والتعليم', 'Ministry of Education', 'BookOpen', 'https://digital.gov.eg/education/high-school-result', 0.0),
('حجز تذكرة قطار', 'Book Train Ticket', 'Transport', 'سكك حديد مصر', 'Egypt Railways', 'Train', 'https://enr.gov.eg', 0.5),
('تكافل وكرامة', 'Takaful & Karama', 'Social Solidarity', 'التضامن الاجتماعي', 'Social Solidarity', 'HandHelping', 'https://tk.moss.gov.eg', 0.0),
('رول جلسة', 'Session Roll', 'Justice', 'وزارة العدل', 'Ministry of Justice', 'Scale', 'https://moj.gov.eg', 0.01),
('تأسيس شركة', 'Establish Company', 'Investment', 'هيئة الاستثمار', 'Investment Authority', 'Landmark', 'https://www.gafi.gov.eg', 0.2),
('خدمات رخصة القيادة', 'Driving License Services', 'Traffic', 'المرور', 'Traffic', 'Car', 'https://digital.gov.eg/traffic/driving-license', 0.1);

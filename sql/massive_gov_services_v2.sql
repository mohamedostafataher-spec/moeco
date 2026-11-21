-- Massive Seed for Egyptian Government Services with Carbon Footprint Integration
-- Table: government_services (Updated to user spec)

CREATE TABLE IF NOT EXISTS public.government_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  provider TEXT,
  description_ar TEXT,
  url TEXT NOT NULL,
  icon TEXT,
  carbon_factor_type TEXT, -- Matches carbon_impact_type in TS logic soon
  estimated_saving_kg DECIMAL DEFAULT 0, -- Matches carbon_impact_kg in TS logic soon
  service_type TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  popularity_score INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Electricity
INSERT INTO public.government_services (name_ar, category, provider, url, icon, carbon_factor_type, estimated_saving_kg, is_featured) VALUES
('دفع فاتورة الكهرباء', 'electricity', 'وزارة الكهرباء', 'https://www.eehc.gov.eg/eehcportal/faces/billings.jsp', 'Zap', 'digital_transaction', 1.5, true),
('شحن كارت الكهرباء NFC', 'electricity', 'شركة خالص', 'https://shahl.app', 'Smartphone', 'digital_transaction', 2.0, false),
('طلب عداد كهرباء كودي', 'electricity', 'المنصة الموحدة للكهرباء', 'https://eservices.eehc.gov.eg/', 'Plus', 'paperless', 5.0, false),
('تحويل الممارسة لعداد', 'electricity', 'المنصة الموحدة للكهرباء', 'https://eservices.eehc.gov.eg/', 'RefreshCw', 'paperless', 4.5, false),
('تقديم شكوى فنية كهرباء', 'electricity', 'وزارة الكهرباء', 'https://www.eehc.gov.eg/eehcportal/faces/complaints.jsp', 'AlertTriangle', 'paperless', 1.0, false),
('تركيب عداد إنشائي', 'electricity', 'المنصة الموحدة', 'https://eservices.eehc.gov.eg/', 'Building', 'paperless', 6.0, false),
('تغيير قدرة العداد', 'electricity', 'وزارة الكهرباء', 'https://eservices.eehc.gov.eg/', 'Activity', 'paperless', 3.0, false),
('طلب فحص عداد', 'electricity', 'المنصة الموحدة', 'https://eservices.eehc.gov.eg/', 'Search', 'paperless', 2.5, false),
('رفع عداد مؤقت', 'electricity', 'وزارة الكهرباء', 'https://eservices.eehc.gov.eg/', 'Trash', 'paperless', 1.5, false),
('خدمة كبار المشتركين', 'electricity', 'وزارة الكهرباء', 'https://www.eehc.gov.eg/', 'Star', 'digital_transaction', 0.5, false);

-- Water
INSERT INTO public.government_services (name_ar, category, provider, url, icon, carbon_factor_type, estimated_saving_kg) VALUES
('دفع فواتير المياه', 'water', 'الشركة القابضة للمياه', 'https://www.hcww.com.eg/', 'Droplets', 'digital_transaction', 1.2),
('إبلاغ قرارات عداد المياه', 'water', 'تطبيق 125', 'https://www.hcww.com.eg/', 'Clipboard', 'paperless', 0.8),
('طلب توصيلة مياه صرف', 'water', 'شركة المياه', 'https://www.hcww.com.eg/', 'Plus', 'paperless', 4.0),
('شكاوى تسريب المياه', 'water', 'طوارئ المياه', 'https://www.hcww.com.eg/', 'Phone', 'paperless', 0.5),
('فحص عداد مياه', 'water', 'القابضة للمياه', 'https://www.hcww.com.eg/', 'Search', 'paperless', 2.0),
('تغيير اسم مالك العداد', 'water', 'شركة المياه', 'https://www.hcww.com.eg/', 'User', 'paperless', 3.0);

-- Gas
INSERT INTO public.government_services (name_ar, category, provider, url, icon, carbon_factor_type, estimated_saving_kg) VALUES
('دفع فاتورة الغاز بتروتريد', 'gas', 'بتروتريد', 'https://www.petrotrade.com.eg/web/billing.html', 'Flame', 'digital_transaction', 1.5),
('تسجيل قراءة عداد الغاز', 'gas', 'بتروتريد', 'https://www.petrotrade.com.eg/web/enat.html', 'Edit', 'paperless', 1.0),
('خدمات تاون جاس', 'gas', 'تاون جاس', 'https://towngas.com.eg/', 'Shield', 'paperless', 1.0),
('طوارئ الغاز 129', 'gas', 'طوارئ الغاز', 'tel:129', 'Activity', 'paperless', 15.0);

-- Traffic (Merour)
INSERT INTO public.government_services (name_ar, category, provider, url, icon, carbon_factor_type, estimated_saving_kg, is_featured) VALUES
('مخالفات المرور', 'traffic', 'النيابة العامة', 'https://ppo.gov.eg/', 'FileText', 'digital_transaction', 3.0, true),
('تجديد رخصة مركبة', 'traffic', 'مرور مصر', 'https://traffic.moi.gov.eg/', 'Car', 'paperless', 5.0, true),
('بدل فاقد رخصة قيادة', 'traffic', 'مصر الرقمية', 'https://digital.gov.eg/', 'User', 'paperless', 4.0, false),
('تظلم مخالفات المرور', 'traffic', 'النيابة العامة', 'https://ppo.gov.eg/', 'Gavel', 'paperless', 3.5, false),
('موعد فحص فني', 'traffic', 'وزارة الداخلية', 'https://moi.gov.eg/', 'Calendar', 'paperless', 2.5, false);

-- Civil Status (Ahwal Madania)
INSERT INTO public.government_services (name_ar, category, provider, url, icon, carbon_factor_type, estimated_saving_kg) VALUES
('شهادة ميلاد مميكنة', 'civil', 'مصر الرقمية', 'https://digital.gov.eg/', 'Baby', 'paperless', 4.0),
('تجديد بطاقة الرقم القومي', 'civil', 'وزارة الداخلية', 'https://cso.moi.gov.eg/', 'IdCard', 'paperless', 6.0),
('استخراج قيد عائلي', 'civil', 'مصر الرقمية', 'https://digital.gov.eg/', 'Users', 'paperless', 4.5),
('وثيقة زواج', 'civil', 'مصر الرقمية', 'https://digital.gov.eg/', 'Heart', 'paperless', 4.0);

-- Housing
INSERT INTO public.government_services (name_ar, category, provider, url, icon, carbon_factor_type, estimated_saving_kg) VALUES
('إسكان اجتماعي حجز', 'housing', 'التمويل العقاري', 'https://shmff.gov.eg/', 'Home', 'paperless', 10.0),
('استعلام عن طلب إسكان', 'housing', 'صندوق الإسكان', 'https://shmff.gov.eg/', 'Search', 'paperless', 1.0),
('طلب تصالح بناء', 'housing', 'بوابة المحليات', 'http://www.lgs.gov.eg/', 'Anchor', 'paperless', 15.0);

-- Education
INSERT INTO public.government_services (name_ar, category, provider, url, icon, carbon_factor_type, estimated_saving_kg) VALUES
('نتائج الثانوية العامة', 'education', 'وزارة التربية والتعليم', 'https://emis.gov.eg/', 'GraduationCap', 'paperless', 2.0),
('تنسيق الجامعات', 'education', 'بوابة التنسيق', 'https://tansik.digital.gov.eg/', 'BookOpen', 'paperless', 10.0),
('بنك المعرفة المصري', 'education', 'EKB', 'https://www.ekb.eg/', 'Monitor', 'paperless', 50.0);

-- Health
INSERT INTO public.government_services (name_ar, category, provider, url, icon, carbon_factor_type, estimated_saving_kg) VALUES
('حجز تطعيمات', 'health', 'وزارة الصحة', 'https://egcovac.mohp.gov.eg/', 'ShieldCheck', 'paperless', 3.0),
('تأمين صحي شامل', 'health', 'هيئة التأمين الصحي', 'https://www.uhi.gov.eg/', 'PlusSquare', 'paperless', 5.0),
('موعد عيادات', 'health', 'وزارة الصحة', 'https://www.mohp.gov.eg/', 'Calendar', 'paperless', 2.0);

-- Environment
INSERT INTO public.government_services (name_ar, category, provider, url, icon, carbon_factor_type, estimated_saving_kg, is_featured) VALUES
('بلاغ تلوث', 'environment', 'وزارة البيئة', 'http://www.eeaa.gov.eg/', 'AlertTriangle', 'eco_action', 5.0),
('دعم طاقة شمسية', 'environment', 'هيئة الطاقة المتجددة', 'http://www.nrea.gov.eg/', 'Sun', 'eco_conversion', 100.0, true),
('تدوير مخلفات إلكترونية', 'environment', 'E-Tadweer', 'https://etadweer.com/', 'Smartphone', 'eco_recycling', 15.0, true),
('حساب البصمة الكربونية للمنزل', 'environment', 'MoEco Intelligence', 'https://ais-pre.egypt.gov.eg/', 'Target', 'eco_calculation', 10.0, true);

-- Transport
INSERT INTO public.government_services (name_ar, category, provider, url, icon, carbon_factor_type, estimated_saving_kg) VALUES
('حجز قطارات', 'transport', 'سكك حديد مصر', 'https://enr.gov.eg/', 'Train', 'paperless', 8.0),
('اشتراك مترو', 'transport', 'مترو القاهرة', 'http://www.cairometro.gov.eg/', 'CreditCard', 'paperless', 4.0),
('تتبع حافلات عامة', 'transport', 'النقل العام', 'http://www.cairo.gov.eg/', 'MapPin', 'eco_action', 5.0);

-- Courts
INSERT INTO public.government_services (name_ar, category, provider, url, icon, carbon_factor_type, estimated_saving_kg) VALUES
('عمل توكيل محامي', 'courts', 'وزارة العدل', 'https://digital.gov.eg/', 'Briefcase', 'paperless', 9.0),
('استعلام عن قضية', 'courts', 'وزارة العدل', 'https://moj.gov.eg/', 'Search', 'paperless', 3.0);

-- Banking & Finance
INSERT INTO public.government_services (name_ar, category, provider, url, icon, carbon_factor_type, estimated_saving_kg) VALUES
('فتح حساب بنكي إلكتروني', 'banking', 'البنك الأهلي المصري', 'https://www.nbe.com.eg/', 'Wallet', 'digital_transaction', 5.0),
('محفظة بنك مصر', 'banking', 'بنك مصر', 'https://www.banquemisr.com/', 'Smartphone', 'digital_transaction', 4.0);

-- Adding 150+ more services via massive series for realism
INSERT INTO public.government_services (name_ar, category, provider, url, icon, carbon_factor_type, estimated_saving_kg, subcategory)
SELECT 
  CASE (i % 15)
    WHEN 0 THEN 'تجديد تصريح عمل رقم ' || i
    WHEN 1 THEN 'استخراج براءة ذمة ' || i
    WHEN 2 THEN 'طلب صيانة مرافق ' || i
    WHEN 3 THEN 'تصديق شهادة ' || i
    WHEN 4 THEN 'استعلام عن حصة تموينية ' || i
    WHEN 5 THEN 'حجز موعد بريد ' || i
    WHEN 6 THEN 'دفع فاتورة هاتف ' || i
    WHEN 7 THEN 'طلب دعم فني ' || i
    WHEN 8 THEN 'استشارة قانونية ' || i
    WHEN 9 THEN 'بلاغ إهدار مياه ' || i
    WHEN 10 THEN 'طلب حاوية تدوير ' || i
    WHEN 11 THEN 'شهادة صحية رقم ' || i
    WHEN 12 THEN 'ترخيص محل ' || i
    WHEN 13 THEN 'طلب إنارة شارع ' || i
    ELSE 'خدمة المواطن رقم ' || i
  END,
  CASE (i % 12)
    WHEN 0 THEN 'electricity'
    WHEN 1 THEN 'water'
    WHEN 2 THEN 'gas'
    WHEN 3 THEN 'traffic'
    WHEN 4 THEN 'civil'
    WHEN 5 THEN 'housing'
    WHEN 6 THEN 'education'
    WHEN 7 THEN 'health'
    WHEN 8 THEN 'taxes'
    WHEN 9 THEN 'environment'
    WHEN 10 THEN 'transport'
    ELSE 'general'
  END,
  'بوابة الخدمات الحكومية الموحدة',
  'https://digital.gov.eg/',
  'Grid',
  'paperless',
  (random() * 5 + 0.5)::numeric,
  'خدمات فرعية'
FROM generate_series(50, 250) s(i);

-- Update stats
UPDATE public.government_services SET usage_count = floor(random() * 10000), popularity_score = floor(random() * 100);

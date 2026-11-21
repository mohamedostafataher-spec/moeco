-- =========================================================
-- MOECO GOVERNMENT SERVICES MASTER SETUP
-- =========================================================

-- 1. Create table (Just in case)
CREATE TABLE IF NOT EXISTS public.gov_services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  icon TEXT DEFAULT 'Landmark',
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  open_in_webview BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  carbon_impact_kg DECIMAL(6,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Insert all services
INSERT INTO public.gov_services (name, category, subcategory, description, icon, url, carbon_impact_kg) VALUES
-- Utilities
('استكمال عداد كهرباء', 'Utilities', 'Electricity', 'استكمال عداد كهرباء', 'Zap', 'https://digital.gov.eg/utilities/electricity-meter', 0.5),
('استعلام فاتورة الكهرباء', 'Utilities', 'Electricity', 'استعلام فاتورة الكهرباء', 'Zap', 'https://digital.gov.eg/utilities/electricity-bill', 0.1),
('سداد فاتورة المياه', 'Utilities', 'Water', 'سداد فاتورة المياه', 'Droplets', 'https://digital.gov.eg/utilities/water-bill', 0.1),
('سداد فاتورة الغاز الطبيعي', 'Utilities', 'Gas', 'سداد فاتورة الغاز الطبيعي', 'Flame', 'https://digital.gov.eg/utilities/gas-bill', 0.1),
('شحن رصيد محمول', 'Utilities', 'Mobile', 'شحن رصيد محمول', 'Smartphone', 'https://digital.gov.eg/utilities/mobile-recharge', 0.05),

-- Subsidy
('تفعيل بطاقة التموين', 'Subsidy', 'Ration', 'تفعيل بطاقة التموين', 'CreditCard', 'https://digital.gov.eg/supply/activate-card', 0.0),
('إضافة مولود جديد', 'Subsidy', 'Ration', 'إضافة مولود جديد', 'UserPlus', 'https://digital.gov.eg/supply/add-newborn', 0.0),
('نقل بطاقة تموين', 'Subsidy', 'Ration', 'نقل بطاقة تموين', 'Truck', 'https://digital.gov.eg/supply/transfer-card', 0.0),
('بدل فاقد بطاقة تموين', 'Subsidy', 'Ration', 'بدل فاقد بطاقة تموين', 'CreditCard', 'https://digital.gov.eg/supply/replace-card', 0.0),
('الاستعلام عن السلع التموينية', 'Subsidy', 'Ration', 'الاستعلام عن السلع التموينية', 'Search', 'https://digital.gov.eg/supply/check-rations', 0.0),

-- Documentation
('الاستعلام عن وثيقة', 'Documentation', 'Official', 'الاستعلام عن وثيقة', 'FileText', 'https://digital.gov.eg/documentation/inquire', 0.02),
('إصدار توكيل', 'Documentation', 'Official', 'إصدار توكيل', 'FileText', 'https://digital.gov.eg/documentation/power-of-attorney', 0.02),
('طلب صورة رسمية', 'Documentation', 'Official', 'طلب صورة رسمية', 'FileText', 'https://digital.gov.eg/documentation/certified-copy', 0.02),

-- Civil Status
('بدل فاقد الرقم القومي', 'Civil Registry', 'ID', 'بدل فاقد الرقم القومي', 'IdCard', 'https://digital.gov.eg/civil/replace-id', 0.03),
('استخراج قيد ميلاد', 'Civil Registry', 'ID', 'استخراج قيد ميلاد', 'FileText', 'https://digital.gov.eg/civil/birth-certificate', 0.03),
('قيد عائلي', 'Civil Registry', 'ID', 'قيد عائلي', 'FileText', 'https://digital.gov.eg/civil/family-record', 0.03),
('شهادة وفاة', 'Civil Registry', 'ID', 'شهادة وفاة', 'FileText', 'https://digital.gov.eg/civil/death-certificate', 0.03),

-- Traffic
('الاستعلام عن المخالفات المرورية', 'Traffic', 'Violations', 'الاستعلام عن المخالفات المرورية', 'Car', 'https://digital.gov.eg/traffic/violations', 0.0),
('تظلم من مخالفة مرورية', 'Traffic', 'Violations', 'تظلم من مخالفة مرورية', 'AlertTriangle', 'https://digital.gov.eg/traffic/objection', 0.0),
('تجديد رخصة المركبة', 'Traffic', 'License', 'تجديد رخصة المركبة', 'Car', 'https://digital.gov.eg/traffic/renew-license', 0.2),
('خدمات رخصة القيادة', 'Traffic', 'License', 'خدمات رخصة القيادة', 'Car', 'https://digital.gov.eg/traffic/driving-license', 0.1),

-- Commercial Registry
('استخراج قيد تجاري', 'Commercial Registry', 'Business', 'استخراج قيد تجاري', 'Building2', 'https://digital.gov.eg/commercial/extract', 0.1),
('تجديد السجل التجاري', 'Commercial Registry', 'Business', 'تجديد السجل التجاري', 'Building2', 'https://digital.gov.eg/commercial/renew', 0.1),
('الاستعلام عن السجل التجاري', 'Commercial Registry', 'Business', 'الاستعلام عن السجل التجاري', 'Building2', 'https://digital.gov.eg/commercial/inquire', 0.02),

-- Health
('حجز موعد طبي', 'Health', 'Appointments', 'حجز موعد طبي', 'Activity', 'https://digital.gov.eg/health/book-appointment', 0.01),
('نتائج التحاليل', 'Health', 'Appointments', 'نتائج التحاليل', 'Activity', 'https://digital.gov.eg/health/test-result', 0.01),
('التقرير الطبي', 'Health', 'Appointments', 'التقرير الطبي', 'Activity', 'https://digital.gov.eg/health/medical-report', 0.01),
('التطعيمات', 'Health', 'Appointments', 'التطعيمات', 'Activity', 'https://digital.gov.eg/health/vaccinations', 0.0),

-- Education
('نتيجة الثانوية العامة', 'Education', 'Academic', 'نتيجة الثانوية العامة', 'BookOpen', 'https://digital.gov.eg/education/high-school-result', 0.0),
('التنسيق الإلكتروني', 'Education', 'Academic', 'التنسيق الإلكتروني', 'BookOpen', 'https://digital.gov.eg/education/university-coordination', 0.0),
('نتيجة الإعدادية', 'Education', 'Academic', 'نتيجة الإعدادية', 'BookOpen', 'https://digital.gov.eg/education/preparatory-result', 0.0),

-- Transport
('حجز تذكرة قطار', 'Transportation', 'Trains', 'حجز تذكرة قطار', 'Train', 'https://enr.gov.eg', 0.5),
('حجز تذكرة مترو', 'Transportation', 'Metro', 'حجز تذكرة مترو', 'Train', 'https://cairometro.gov.eg', 0.3),
('مواعيد القطارات', 'Transportation', 'Trains', 'مواعيد القطارات', 'Clock', 'https://enr.gov.eg', 0.0),

-- Social Solidarity
('تكافل وكرامة', 'Social Solidarity', 'Support', 'تكافل وكرامة', 'HandHelping', 'https://tk.moss.gov.eg', 0.0),
('بطاقة الخدمات المتكاملة', 'Social Solidarity', 'Support', 'بطاقة الخدمات المتكاملة', 'HandHelping', 'https://rdis.moss.gov.eg', 0.0),
('الاستعلام عن كارت الخدمات', 'Social Solidarity', 'Support', 'الاستعلام عن كارت الخدمات', 'HandHelping', 'https://www.moss.gov.eg', 0.0),

-- Justice
('رول جلسة', 'Justice', 'Law', 'رول جلسة', 'Scale', 'https://moj.gov.eg', 0.01),
('موقف دعوى', 'Justice', 'Law', 'موقف دعوى', 'Scale', 'https://moj.gov.eg', 0.01),
('إقامة دعوى مدنية', 'Justice', 'Law', 'إقامة دعوى مدنية', 'Scale', 'https://digital.gov.eg', 0.02),

-- Investment
('تأسيس شركة', 'Investment', 'Business', 'تأسيس شركة', 'Landmark', 'https://www.gafi.gov.eg', 0.2),
('تجديد ترخيص استثمار', 'Investment', 'Business', 'تجديد ترخيص استثمار', 'Landmark', 'https://www.gafi.gov.eg', 0.1),
('صحيفة استثمارية', 'Investment', 'Business', 'صحيفة استثمارية', 'Landmark', 'https://www.gafi.gov.eg', 0.02),

-- Payments
('WE Pay', 'General', 'Payments', 'WE Pay', 'Smartphone', 'https://wepay.eg', 0.01),
('فوري', 'General', 'Payments', 'Fawry', 'CreditCard', 'https://fawry.com', 0.01),
('منصة الكهرباء الموحدة', 'General', 'Payments', 'منصة الكهرباء الموحدة', 'Zap', 'https://eservices.eehc.gov.eg', 0.01),

-- Added Extras
('استخراج كارت الفلاح', 'Environment', 'Agriculture', 'استخراج كارت الفلاح', 'Leaf', 'https://agriculture.gov.eg/farmer-card', 0.05),
('حصر الأراضي الزراعية', 'Environment', 'Agriculture', 'حصر الأراضي الزراعية', 'Leaf', 'https://agriculture.gov.eg/land-survey', 0.02),
('تراخيص المبيدات', 'Environment', 'Agriculture', 'تراخيص المبيدات', 'Leaf', 'https://agriculture.gov.eg/pesticides', 0.03),
('خدمات البريد المصري', 'Environment', 'ICT', 'خدمات البريد المصري', 'Building2', 'https://egyptpost.org', 0.01),
('حجز تذكرة متحف', 'Environment', 'Tourism', 'حجز تذكرة متحف', 'Landmark', 'https://egymonuments.com', 0.02),
('التصالح في مخالفات البناء', 'Environment', 'Housing', 'التصالح في مخالفات البناء', 'Building2', 'https://digital.gov.eg/building-violations', 0.1),
('حجز وحدة سكنية', 'Environment', 'Housing', 'حجز وحدة سكنية', 'Building2', 'https://hdb.gov.eg/reservation', 0.2)
ON CONFLICT (url) DO NOTHING;

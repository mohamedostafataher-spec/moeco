-- ============================================  
-- CREATE OR UPDATE government_services TABLE  
-- ============================================  
  
CREATE TABLE IF NOT EXISTS government_services (  
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  
  name_ar TEXT NOT NULL,  
  name_en TEXT,  
  description_ar TEXT,  
  description_en TEXT,  
  category TEXT NOT NULL,  
  subcategory TEXT,  
  url TEXT NOT NULL UNIQUE,  
  icon TEXT,  
  carbon_impact_type TEXT DEFAULT 'paper', -- 'paper', 'transport', 'energy'  
  carbon_impact_kg DECIMAL DEFAULT 0,  
  steps JSONB, -- Array of step objects: [{"step": 1, "text": "...", "duration_minutes": 5}]  
  required_documents TEXT[], -- Array of document names  
  estimated_time TEXT, -- e.g., "30 دقيقة", "3 أيام"  
  fee_estimate DECIMAL,  
  office_location JSONB, -- { "lat": 30.0444, "lng": 31.2357, "name": "مكتب الأحوال المدنية بالعباسية", "address": "..." }  
  working_hours TEXT, -- e.g., "8:00 ص - 2:00 م (الأحد - الخميس)"  
  phone TEXT,  
  is_active BOOLEAN DEFAULT true,  
  usage_count INTEGER DEFAULT 0,  
  created_at TIMESTAMP DEFAULT NOW()  
);  
  
-- ============================================  
-- CREATE SUPPORTING TABLES  
-- ============================================  
  
-- User favorites  
CREATE TABLE IF NOT EXISTS user_favorites (  
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  
  service_id UUID REFERENCES government_services(id) ON DELETE CASCADE,  
  created_at TIMESTAMP DEFAULT NOW(),  
  UNIQUE(user_id, service_id)  
);  
  
-- User badges  
CREATE TABLE IF NOT EXISTS user_badges (  
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  
  badge_name TEXT NOT NULL,  
  badge_icon TEXT,  
  earned_at TIMESTAMP DEFAULT NOW(),  
  UNIQUE(user_id, badge_name)  
);  
  
-- User requests (for AI generator drafts)  
CREATE TABLE IF NOT EXISTS user_requests (  
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  
  request_type TEXT, -- 'power_of_attorney', 'birth_certificate', 'complaint'  
  content TEXT NOT NULL,  
  is_completed BOOLEAN DEFAULT false,  
  created_at TIMESTAMP DEFAULT NOW()  
);  
  
-- ============================================  
-- ENABLE REALTIME  
-- ============================================  
ALTER TABLE government_services REPLICA IDENTITY FULL;  
ALTER TABLE user_favorites REPLICA IDENTITY FULL;  
ALTER TABLE user_badges REPLICA IDENTITY FULL;  
  
-- ============================================  
-- INSERT ALL SERVICES  
-- ============================================  
  
INSERT INTO government_services (name_ar, name_en, category, url, icon, carbon_impact_kg, carbon_impact_type, steps, required_documents, estimated_time, fee_estimate, office_location, working_hours) VALUES  
-- Civil Status Services  
('إصدار شهادة ميلاد', 'Birth Certificate', 'الأحوال المدنية', 'https://digital.gov.eg/civil/birth-certificate', 'Baby', 0.05, 'paper',   
 '[{"step":1,"text":"تقديم طلب إلكتروني أو زيارة مكتب الأحوال المدنية","duration_minutes":5},{"step":2,"text":"إرفاق المستندات المطلوبة","duration_minutes":10},{"step":3,"text":"سداد الرسوم","duration_minutes":5},{"step":4,"text":"استلام الشهادة","duration_minutes":30}]',  
 ARRAY['شهادة ميلاد المستشفى', 'بطاقة الرقم القومي للأب', 'بطاقة الرقم القومي للأم', 'إيصال سداد'],  
 '30 دقيقة', 2.5, '{"lat": 30.0444, "lng": 31.2357, "name": "مكتب الأحوال المدنية بالعباسية", "address": "شارع رمسيس - أمام مستشفى الدمرداش"}', '8:00 ص - 2:00 م (الأحد - الخميس)'),  
  
('بدل فاقد للرقم القومي', 'Lost ID Replacement', 'الأحوال المدنية', 'https://digital.gov.eg/civil/replace-id', 'IdCard', 2.5, 'transport',  
 '[{"step":1,"text":"تعبئة نموذج طلب بدل فاقد","duration_minutes":5},{"step":2,"text":"إرفاق صورة شخصية حديثة","duration_minutes":5},{"step":3,"text":"سداد رسوم البدل","duration_minutes":5},{"step":4,"text":"استلام البطاقة بعد 15 يوم","duration_minutes":1}]',  
 ARRAY['صورة شخصية حديثة (4×6)', 'محضر شرطة الفقد (للحالات المفقودة)', 'بطاقة العائلة'],  
 '15 يوم', 50, '{"lat": 30.0444, "lng": 31.2357, "name": "مكتب الأحوال المدنية بالعباسية", "address": "شارع رمسيس"}', '8:00 ص - 2:00 م'),  
  
('إصدار قيد عائلي', 'Family Record', 'الأحوال المدنية', 'https://digital.gov.eg/civil/family-record', 'Users', 0.05, 'paper',  
 '[{"step":1,"text":"تقديم طلب إلى مكتب الأحوال","duration_minutes":5},{"step":2,"text":"إحضار شهادات ميلاد أفراد الأسرة","duration_minutes":10},{"step":3,"text":"سداد الرسم","duration_minutes":5}]',  
 ARRAY['شهادات ميلاد الأب والأم والأبناء', 'بطاقة الرقم القومي للأب', 'إيصال سداد'],  
 '1 ساعة', 5, '{"lat": 30.0444, "lng": 31.2357, "name": "مكتب الأحوال المدنية بالعباسية"}', '8:00 ص - 2:00 م'),  
  
('إصدار شهادة وفاة', 'Death Certificate', 'الأحوال المدنية', 'https://digital.gov.eg/civil/death-certificate', 'Heart', 0.05, 'paper',  
 '[{"step":1,"text":"تقديم شهادة وفاة من المستشفى","duration_minutes":5},{"step":2,"text":"التوجه إلى مكتب الأحوال المدنية","duration_minutes":60},{"step":3,"text":"استلام الشهادة","duration_minutes":10}]',  
 ARRAY['شهادة وفاة طبية معتمدة', 'بطاقة الرقم القومي للمتوفى', 'بطاقة الرقم القومي للمبلغ'],  
 '30 دقيقة', 2, '{"lat": 30.0444, "lng": 31.2357, "name": "مكتب الأحوال المدنية بالعباسية"}', '8:00 ص - 2:00 م'),  
  
-- Traffic Services  
('تجديد رخصة القيادة', 'Driving License Renewal', 'المرور', 'https://digital.gov.eg/traffic/renew-license', 'Car', 3.2, 'transport',  
 '[{"step":1,"text":"تقديم طلب التجديد إلكترونيًا","duration_minutes":5},{"step":2,"text":"رفع المستندات المطلوبة","duration_minutes":10},{"step":3,"text":"سداد الرسوم إلكترونيًا","duration_minutes":5},{"step":4,"text":"استلام الرخصة من أقرب مكتب بريد","duration_minutes":30}]',  
 ARRAY['الرخصة القديمة', 'صورة شخصية حديثة', 'شهادة طبية معتمدة', 'بطاقة الرقم القومي'],  
 '3 أيام', 155, '{"lat": 30.0675, "lng": 31.2903, "name": "مكتب ترخيص العباسية", "address": "شارع رمسيس - أمام نقابة الصحفيين"}', '9:00 ص - 3:00 م'),  
  
('الاستعلام عن المخالفات المرورية', 'Traffic Violations', 'المرور', 'https://digital.gov.eg/traffic/violations', 'AlertTriangle', 0, 'paper',  
 '[{"step":1,"text":"إدخال رقم السيارة","duration_minutes":1},{"step":2,"text":"عرض جميع المخالفات","duration_minutes":1},{"step":3,"text":"دفع المخالفات إلكترونيًا","duration_minutes":5}]',  
 ARRAY['رقم السيارة', 'رقم رخصة المركبة'],  
 'دقيقة', 0, NULL, 'أونلاين 24 ساعة'),  
  
('تجديد رخصة السيارة', 'Vehicle License Renewal', 'المرور', 'https://digital.gov.eg/traffic/renew-vehicle-license', 'Truck', 3.2, 'transport',  
 '[{"step":1,"text":"فحص السيارة في مركز فني معتمد","duration_minutes":30},{"step":2,"text":"سداد الرسوم إلكترونيًا","duration_minutes":5},{"step":3,"text":"استلام الرخصة الجديدة","duration_minutes":10}]',  
 ARRAY['الرخصة القديمة', 'بطاقة الرقم القومي', 'شهادة الفحص الفني'],  
 'أسبوع', 250, '{"lat": 30.0675, "lng": 31.2903, "name": "مكتب ترخيص العباسية"}', '9:00 ص - 3:00 م'),  
  
-- Documentation Services  
('إصدار توكيل عام', 'General Power of Attorney', 'التوثيق', 'https://digital.gov.eg/documentation/power-of-attorney', 'PenTool', 1.5, 'transport',  
 '[{"step":1,"text":"كتابة صيغة التوكيل","duration_minutes":10},{"step":2,"text":"التوجه إلى مكتب التوثيق","duration_minutes":30},{"step":3,"text":"التوقيع بحضور الموثق","duration_minutes":10},{"step":4,"text":"استلام التوكيل","duration_minutes":10}]',  
 ARRAY['بطاقة الرقم القومي للموكل', 'بطاقة الرقم القومي للوكيل', 'رسوم السداد'],  
 'ساعة', 50, '{"lat": 30.0500, "lng": 31.2400, "name": "مكتب توثيق وسط القاهرة", "address": "شارع قصر العيني"}', '9:00 ص - 2:00 م'),  
  
('تصديق على توقيع', 'Signature Authentication', 'التوثيق', 'https://digital.gov.eg/documentation/signature-authentication', 'Edit', 1.5, 'transport',  
 '[{"step":1,"text":"الحضور إلى مكتب التوثيق","duration_minutes":20},{"step":2,"text":"التوقيع أمام الموثق","duration_minutes":5},{"step":3,"text":"استلام المستند مصدقًا","duration_minutes":10}]',  
 ARRAY['المستند الأصلي', 'بطاقة الرقم القومي'],  
 '30 دقيقة', 10, '{"lat": 30.0500, "lng": 31.2400, "name": "مكتب توثيق وسط القاهرة"}', '9:00 ص - 2:00 م'),  
  
-- Subsidy Services  
('تفعيل بطاقة التموين', 'Activate Ration Card', 'التموين', 'https://digital.gov.eg/supply/activate-card', 'ShoppingBag', 0.5, 'paper',  
 '[{"step":1,"text":"دخول رابط تفعيل البطاقة","duration_minutes":2},{"step":2,"text":"إدخال رقم البطاقة ورقم العائلة","duration_minutes":3},{"step":3,"text":"تأكيد البيانات","duration_minutes":2}]',  
 ARRAY['رقم بطاقة التموين', 'الرقم القومي لرب الأسرة'],  
 '5 دقائق', 0, NULL, 'أونلاين 24 ساعة'),  
  
('الاستعلام عن السلع التموينية', 'Ration Goods Inquiry', 'التموين', 'https://digital.gov.eg/supply/check-rations', 'Package', 0, 'paper',  
 '[{"step":1,"text":"إدخال رقم بطاقة التموين","duration_minutes":1},{"step":2,"text":"عرض السلع المتاحة","duration_minutes":1}]',  
 ARRAY['رقم بطاقة التموين'],  
 'دقيقتين', 0, NULL, 'أونلاين 24 ساعة'),  
  
( 'إضافة مولود على بطاقة التموين', 'Add Newborn to Ration Card', 'التموين', 'https://digital.gov.eg/supply/add-newborn', 'Baby', 0.5, 'paper',  
 '[{"step":1,"text":"تسجيل الدخول","duration_minutes":2},{"step":2,"text":"إدخال بيانات المولود","duration_minutes":5},{"step":3,"text":"رفع شهادة الميلاد","duration_minutes":3}]',  
 ARRAY['رقم بطاقة التموين', 'شهادة ميلاد المولود', 'الرقم القومي لرب الأسرة'],  
 'أسبوع', 0, NULL, 'أونلاين 24 ساعة'),  
  
-- Health Services  
('حجز موعد طبي', 'Book Medical Appointment', 'الصحة', 'https://digital.gov.eg/health/book-appointment', 'Calendar', 2.0, 'transport',  
 '[{"step":1,"text":"اختيار التخصص والمستشفى","duration_minutes":3},{"step":2,"text":"اختيار التاريخ والوقت المتاح","duration_minutes":2},{"step":3,"text":"تأكيد الحجز","duration_minutes":2}]',  
 ARRAY[]::TEXT[], '5 دقائق', 0, '{"lat": 30.0300, "lng": 31.2300, "name": "مستشفى الدمرداش", "address": "شارع رمسيس"}', 'أونلاين 24 ساعة'),  
  
('الاستعلام عن نتائج التحاليل', 'Test Results', 'الصحة', 'https://digital.gov.eg/health/test-results', 'Activity', 0, 'paper',  
 '[{"step":1,"text":"إدخال رقم الطلب أو الرقم القومي","duration_minutes":1},{"step":2,"text":"عرض نتيجة التحليل","duration_minutes":1}]',  
 ARRAY['رقم الطلب أو الرقم القومي'],  
 'دقيقة', 0, NULL, 'أونلاين 24 ساعة'),  
  
-- Housing Services  
('طلب وحدة سكنية (الإسكان الاجتماعي)', 'Social Housing Request', 'الإسكان', 'https://digital.gov.eg/housing/social-housing', 'Home', 3.0, 'transport',  
 '[{"step":1,"text":"تعبئة طلب الإسكان","duration_minutes":15},{"step":2,"text":"رفع المستندات المطلوبة","duration_minutes":10},{"step":3,"text":"سداد جدية الحجز","duration_minutes":5},{"step":4,"text":"متابعة نتيجة القرعة","duration_minutes":1}]',  
 ARRAY['بطاقة الرقم القومي', 'قيد عائلي', 'إيصال مرافق حديث', 'شهادة دخل'],  
 'شهرين', 5000, NULL, 'أونلاين 24 ساعة'),  
  
('شهر عقاري', 'Property Registration', 'الإسكان', 'https://digital.gov.eg/housing/property-registration', 'FileText', 2.5, 'transport',  
 '[{"step":1,"text":"تقديم عقد البيع","duration_minutes":10},{"step":2,"text":"سداد الرسوم","duration_minutes":5},{"step":3,"text":"مراجعة البيانات","duration_minutes":30},{"step":4,"text":"استلام عقد الشهر","duration_minutes":10}]',  
 ARRAY['عقد البيع الأصلي', 'بطاقات الرقم القومي للطرفين', 'معاينة من الضرائب العقارية'],  
 '3 ساعات', 2000, '{"lat": 30.0550, "lng": 31.2500, "name": "شهر عقاري وسط القاهرة"}', '9:00 ص - 2:00 م'),  
  
-- Labor & Pensions Services  
('الاستعلام عن المعاش', 'Pension Inquiry', 'التأمينات', 'https://digital.gov.eg/pensions/inquiry', 'DollarSign', 0, 'paper',  
 '[{"step":1,"text":"إدخال الرقم القومي","duration_minutes":1},{"step":2,"text":"عرض قيمة المعاش","duration_minutes":1}]',  
 ARRAY['الرقم القومي للمستحق'],  
 'دقيقة', 0, NULL, 'أونلاين 24 ساعة'),  
  
('تقديم على وظيفة حكومية', 'Government Job Application', 'العمل', 'https://digital.gov.eg/labor/job-application', 'Briefcase', 0.5, 'paper',  
 '[{"step":1,"text":"اختيار الوظيفة المناسبة","duration_minutes":5},{"step":2,"text":"رفع السيرة الذاتية","duration_minutes":5},{"step":3,"text":"تقديم الطلب","duration_minutes":2}]',  
 ARRAY['السيرة الذاتية بصيغة PDF', 'صورة شخصية', 'المؤهلات العلمية'],  
 '15 دقيقة', 0, NULL, 'أونلاين 24 ساعة')  
ON CONFLICT (url) DO NOTHING;

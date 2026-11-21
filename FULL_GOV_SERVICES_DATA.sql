-- ============================================  
-- FULL GOVERNMENT SERVICES DATA POPULATION
-- ============================================  

-- Clear existing to avoid duplicates if needed (optional)
-- DELETE FROM government_services;

INSERT INTO government_services (name_ar, name_en, category, url, icon, carbon_impact_kg, carbon_impact_type, steps, required_documents, estimated_time, fee_estimate, office_location, working_hours) VALUES  

-- 🪪 الأحوال المدنية (Civil Status)
('إصدار شهادة ميلاد', 'Birth Certificate', 'الأحوال المدنية', 'https://digital.gov.eg/civil/birth-certificate', 'Baby', 0.05, 'paper', 
 '[{"step":1,"text":"تقديم طلب إلكتروني","duration_minutes":5},{"step":2,"text":"سداد الرسوم","duration_minutes":2},{"step":3,"text":"استلام الشهادة من البريد","duration_minutes":1440}]', 
 ARRAY['الرقم القومي للأب', 'الرقم القومي للأم'], 'يوم واحد', 50, '{"lat": 30.0444, "lng": 31.2357, "name": "مكتب الأحوال المدنية بالعباسية"}', '8:00 ص - 2:00 م'),

('إصدار شهادة وفاة', 'Death Certificate', 'الأحوال المدنية', 'https://digital.gov.eg/civil/death-certificate', 'Heart', 0.05, 'paper', 
 '[{"step":1,"text":"إبلاغ عن الوفاة","duration_minutes":10},{"step":2,"text":"تقديم الطلب أونلاين","duration_minutes":5}]', 
 ARRAY['شهادة وفاة طبية', 'بطاقة المتوفى'], 'يوم واحد', 25, NULL, '24/7 إلكتروني'),

('إصدار قيد عائلي', 'Family Record', 'الأحوال المدنية', 'https://digital.gov.eg/civil/family-record', 'Users', 0.1, 'paper', 
 '[{"step":1,"text":"حجز الطلب","duration_minutes":5},{"step":2,"text":"رفع صور شهادات الميلاد","duration_minutes":15}]', 
 ARRAY['شهادات ميلاد الأبناء', 'وثيقة الزواج'], '3 أيام', 75, '{"lat": 30.0444, "lng": 31.2357, "name": "الأحوال المدنية"}', '8:00 ص - 2:00 م'),

('بدل فاقد بطاقة الرقم القومي', 'Lost ID Replacement', 'الأحوال المدنية', 'https://digital.gov.eg/civil/replace-id', 'IdCard', 2.5, 'transport', 
 '[{"step":1,"text":"إبلاغ عن فقدان","duration_minutes":5},{"step":2,"text":"طلب بدل فاقد أونلاين","duration_minutes":10}]', 
 ARRAY['صورة البطاقة القديمة (إن وجدت)', 'محضر فقد'], '15 يوم', 50, '{"lat": 30.0444, "lng": 31.2357, "name": "الأحوال المدنية"}', '8:00 ص - 2:00 م'),

('تجديد بطاقة الرقم القومي', 'Renew ID Card', 'الأحوال المدنية', 'https://digital.gov.eg/civil/renew-id', 'IdCard', 2.5, 'transport', 
 '[{"step":1,"text":"ملء استمارة التجديد","duration_minutes":10},{"step":2,"text":"التصوير في المكتب","duration_minutes":15}]', 
 ARRAY['البطاقة القديمة', 'إثبات محل الإقامة'], '15 يوم', 50, '{"lat": 30.0444, "lng": 31.2357, "name": "الأحوال المدنية"}', '8:00 ص - 2:00 م'),

-- 🚗 المرور (Traffic)
('تجديد رخصة القيادة', 'Driving License Renewal', 'المرور', 'https://digital.gov.eg/traffic/renew-license', 'Car', 3.2, 'transport', 
 '[{"step":1,"text":"اجتياز الكشف الطبي","duration_minutes":30},{"step":2,"text":"سداد المخالفات","duration_minutes":5},{"step":3,"text":"تجديد الرخصة أونلاين","duration_minutes":10}]', 
 ARRAY['الرخصة القديمة', 'شهادة طبية (باطنة ورمد)'], '3 أيام', 155, '{"lat": 30.0675, "lng": 31.2903, "name": "مرور العباسية"}', '9:00 ص - 3:00 م'),

('الاستعلام عن المخالفات', 'Traffic Violations', 'المرور', 'https://digital.gov.eg/traffic/violations', 'AlertTriangle', 0.01, 'energy', 
 '[{"step":1,"text":"إدخال رقم اللوحة","duration_minutes":1},{"step":2,"text":"عرض المخالفات","duration_minutes":1}]', 
 ARRAY['رقم اللوحة'], 'دقيقة واحدة', 0, NULL, '24/7 إلكتروني'),

('دفع المخالفات المرورية', 'Pay Traffic Violations', 'المرور', 'https://digital.gov.eg/traffic/pay-violations', 'CreditCard', 0.5, 'paper', 
 '[{"step":1,"text":"اختيار المخالفات المراد دفعها","duration_minutes":2},{"step":2,"text":"الدفع بالبطاقة البنكية","duration_minutes":3}]', 
 ARRAY['رقم المخالفة'], '5 دقائق', 0, NULL, '24/7 إلكتروني'),

-- ✍️ التوثيق والشهر العقاري (Documentation)
('إصدار توكيل عام', 'General Power of Attorney', 'التوثيق', 'https://digital.gov.eg/documentation/power-of-attorney', 'PenTool', 1.5, 'transport', 
 '[{"step":1,"text":"حجز موعد أونلاين","duration_minutes":2},{"step":2,"text":"التوقيع أمام الموثق","duration_minutes":10}]', 
 ARRAY['بطاقة الموكل', 'بطاقة الوكيل'], 'ساعة واحدة', 50, '{"lat": 30.0500, "lng": 31.2400, "name": "مكتب توثيق وسط القاهرة"}', '9:00 ص - 2:00 م'),

('تصديق على توقيع', 'Signature Authentication', 'التوثيق', 'https://digital.gov.eg/documentation/signature-authentication', 'Edit3', 1.5, 'transport', 
 '[{"step":1,"text":"الحضور الشخصي","duration_minutes":20},{"step":2,"text":"التوقيع المعتمد","duration_minutes":5}]', 
 ARRAY['المستند المراد توثيقه', 'بطاقة الرقم القومي'], '30 دقيقة', 10, '{"lat": 30.0500, "lng": 31.2400, "name": "مكتب توثيق وسط القاهرة"}', '9:00 ص - 2:00 م'),

-- 🍞 التموين (Subsidy)
('تفعيل بطاقة التموين', 'Activate Ration Card', 'التموين', 'https://digital.gov.eg/supply/activate-card', 'ShoppingBag', 0.5, 'paper', 
 '[{"step":1,"text":"طلب التفعيل","duration_minutes":2},{"step":2,"text":"استلام الكود على الموبايل","duration_minutes":1}]', 
 ARRAY['رقم بطاقة التموين', 'رقم الموبايل المسجل'], 'يوم واحد', 0, NULL, '24/7 إلكتروني'),

('إضافة مولود على البطاقة', 'Add Newborn to Ration Card', 'التموين', 'https://digital.gov.eg/supply/add-newborn', 'Baby', 0.5, 'paper', 
 '[{"step":1,"text":"إدخال بيانات المولود","duration_minutes":5},{"step":2,"text":"رفع شهادة الميلاد","duration_minutes":5}]', 
 ARRAY['شهادة ميلاد الطفل', 'رقم البطاقة التموينية'], 'أسبوع', 0, NULL, '24/7 إلكتروني'),

-- 🏥 الصحة (Health)
('حجز موعد طبي', 'Book Medical Appointment', 'الصحة', 'https://digital.gov.eg/health/book-appointment', 'Calendar', 2.0, 'transport', 
 '[{"step":1,"text":"اختيار التخصص والمستشفى","duration_minutes":3},{"step":2,"text":"تأكيد الحجز","duration_minutes":1}]', 
 ARRAY['الرقم القومي'], '5 دقائق', 0, '{"lat": 30.0300, "lng": 31.2300, "name": "مستشفى الدمرداش"}', '24/7 إلكتروني'),

('الاستعلام عن نتائج التحاليل', 'Test Results', 'الصحة', 'https://digital.gov.eg/health/test-results', 'Activity', 0.1, 'paper', 
 '[{"step":1,"text":"إدخال رقم العينة","duration_minutes":1},{"step":2,"text":"تحميل التقرير","duration_minutes":1}]', 
 ARRAY['رقم الطلب'], 'دقيقة واحدة', 0, NULL, '24/7 إلكتروني'),

-- 🏠 الإسكان (Housing)
('طلب وحدة سكنية (الإسكان الاجتماعي)', 'Social Housing Request', 'الإسكان', 'https://digital.gov.eg/housing/social-housing', 'Home', 3.0, 'transport', 
 '[{"step":1,"text":"سداد جدية الحجز","duration_minutes":10},{"step":2,"text":"رفع مفردات المرتب","duration_minutes":15}]', 
 ARRAY['شهادة الدخل', 'إيصال مرافق'], 'شهر واحد', 5000, '{"lat": 30.0550, "lng": 31.2500, "name": "صندوق الإسكان الاجتماعي"}', '9:00 ص - 3:00 م'),

-- 💼 العمل والتأمينات (Labor & Pensions)
('الاستعلام عن المعاش', 'Pension Inquiry', 'التأمينات', 'https://digital.gov.eg/pensions/inquiry', 'DollarSign', 0.1, 'paper', 
 '[{"step":1,"text":"إدخال الرقم التأميني","duration_minutes":1},{"step":2,"text":"عرض البيانات","duration_minutes":1}]', 
 ARRAY['الرقم القومي'], 'دقيقة واحدة', 0, NULL, '24/7 إلكتروني'),

('تقديم على وظيفة حكومية', 'Government Job Application', 'العمل', 'https://digital.gov.eg/labor/job-application', 'Briefcase', 0.5, 'paper', 
 '[{"step":1,"text":"اختيار الوظيفة","duration_minutes":10},{"step":2,"text":"رفع السيرة الذاتية","duration_minutes":10}]', 
 ARRAY['السيرة الذاتية', 'المؤهل الدراسي'], 'أسبوع', 0, NULL, '24/7 إلكتروني')

ON CONFLICT (url) DO UPDATE SET 
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  carbon_impact_kg = EXCLUDED.carbon_impact_kg,
  steps = EXCLUDED.steps,
  required_documents = EXCLUDED.required_documents,
  estimated_time = EXCLUDED.estimated_time,
  fee_estimate = EXCLUDED.fee_estimate,
  office_location = EXCLUDED.office_location,
  working_hours = EXCLUDED.working_hours,
  is_active = true;

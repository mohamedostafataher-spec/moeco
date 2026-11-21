-- ========================================================
-- 🏁 FINAL GOVERNMENT SERVICES SCHEMA & DATA REPAIR
-- ========================================================
-- 1. FIX TABLE STRUCTURE (Safe Add Columns)
-- 2. POPULATE MASSIVE LIVE DATA
-- ========================================================

-- STEP 1: ENSURE TABLE AND COLUMNS EXIST
CREATE TABLE IF NOT EXISTS government_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add missing columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='description_ar') THEN
        ALTER TABLE government_services ADD COLUMN description_ar TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='description_en') THEN
        ALTER TABLE government_services ADD COLUMN description_en TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='icon') THEN
        ALTER TABLE government_services ADD COLUMN icon TEXT DEFAULT 'Info';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='carbon_impact_kg') THEN
        ALTER TABLE government_services ADD COLUMN carbon_impact_kg DECIMAL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='carbon_impact_type') THEN
        ALTER TABLE government_services ADD COLUMN carbon_impact_type TEXT DEFAULT 'digital';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='steps') THEN
        ALTER TABLE government_services ADD COLUMN steps JSONB DEFAULT '[]';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='required_documents') THEN
        ALTER TABLE government_services ADD COLUMN required_documents TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='estimated_time') THEN
        ALTER TABLE government_services ADD COLUMN estimated_time TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='fee_estimate') THEN
        ALTER TABLE government_services ADD COLUMN fee_estimate DECIMAL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='office_location') THEN
        ALTER TABLE government_services ADD COLUMN office_location JSONB DEFAULT '[]';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='working_hours') THEN
        ALTER TABLE government_services ADD COLUMN working_hours TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='phone') THEN
        ALTER TABLE government_services ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='usage_count') THEN
        ALTER TABLE government_services ADD COLUMN usage_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='government_services' AND column_name='is_active') THEN
        ALTER TABLE government_services ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- STEP 2: CLEAR OLD DATA (Optional, ensures fresh massive update)
TRUNCATE government_services CASCADE;

-- STEP 3: MASSIVE DATA POPULATION
INSERT INTO government_services 
(name_ar, name_en, description_ar, description_en, category, url, icon, carbon_impact_kg, carbon_impact_type, steps, required_documents, estimated_time, fee_estimate, office_location, working_hours) 
VALUES  

-- 1. CIVIL STATUS (الأحوال المدنية)
('إصدار شهادة ميلاد', 'Birth Certificate', 'استخراج شهادة ميلاد مميكنة وموثقة.', 'Official digital birth certificate issuance.', 'الأحوال المدنية', 'https://digital.gov.eg/civil/birth-certificate', 'Baby', 0.8, 'paper', 
 '[{"step":1,"text":"تقديم طلب إلكتروني","duration_minutes":5},{"step":2,"text":"دفع الرسوم","duration_minutes":2},{"step":3,"text":"الاستلام من المكتب أو البريد","duration_minutes":1440}]', 
 ARRAY['الرقم القومي للأب/الأم', 'بيانات المولود'], 'يوم عمل', 50, '[{"lat": 30.0444, "lng": 31.2357, "name": "مكتب سجل مدني العباسية", "address": "العباسية، القاهرة", "accuracy": 1.0}]', '8:00 AM - 2:00 PM'),

('تجديد بطاقة الرقم القومي', 'Renew ID Card', 'تجديد البطاقة الشخصية إلكترونياً أو بالحضور.', 'Renew your national identity card.', 'الأحوال المدنية', 'https://digital.gov.eg/civil/renew-id', 'User', 3.5, 'transport', 
 '[{"step":1,"text":"ملء استمارة تجديد","duration_minutes":10},{"step":2,"text":"سداد الرسوم فوري","duration_minutes":2},{"step":3,"text":"التصوير في أقرب مقر","duration_minutes":15}]', 
 ARRAY['البطاقة القديمة', 'إثبات محل الإقامة'], '15 يوم', 50, '[{"lat": 30.0444, "lng": 31.2357, "name": "قطاع الأحوال المدنية", "address": "العباسية، القاهرة", "accuracy": 0.9}]', '8:00 AM - 3:00 PM'),

('بدل فاقد بطاقة', 'Lost ID Replacement', 'طلب استخراج بطاقة رقم قومي بدل تالف أو فاقد.', 'Replace lost or damaged ID card.', 'الأحوال المدنية', 'https://digital.gov.eg/civil/replace-id', 'IdCard', 3.5, 'transport', 
 '[{"step":1,"text":"عمل محضر فقد","duration_minutes":30},{"step":2,"text":"تقديم طلب إلكتروني","duration_minutes":5},{"step":3,"text":"استلام البطاقة","duration_minutes":10}]', 
 ARRAY['صور شخصية', 'محضر الشرطة'], '15 يوم', 75, '[{"lat": 30.0444, "lng": 31.2357, "name": "سجل مدني العباسية", "address": "القاهرة", "accuracy": 1.0}]', '8:00 AM - 2:00 PM'),

-- 2. TRAFFIC (المرور)
('تجديد رخصة السيارة', 'Vehicle License Renewal', 'تجديد رخصة تسيير المركبات أونلاين.', 'Renew your vehicle driving license online.', 'المرور', 'https://digital.gov.eg/traffic/renew-license', 'Car', 12.5, 'transport', 
 '[{"step":1,"text":"فحص فني للمركبة","duration_minutes":60},{"step":2,"text":"سداد الضرائب والمخالفات","duration_minutes":10},{"step":3,"text":"استلام الرخصة","duration_minutes":5}]', 
 ARRAY['شهادة براءة ذمة', 'وثيقة التأمين الإجباري'], '3 أيام', 1500, '[{"lat": 30.0675, "lng": 31.2903, "name": "مرور العباسية الرئيسي", "address": "العباسية", "accuracy": 1.0}]', '9:00 AM - 4:00 PM'),

('الاستعلام عن مخالفات المرور', 'Traffic Violations', 'الاستعلام عن المخالفات برقم اللوحة.', 'Check traffic violations by plate number.', 'المرور', 'https://ppo.gov.eg/traffic', 'AlertTriangle', 4.8, 'transport', 
 '[{"step":1,"text":"إدخال رقم اللوحة","duration_minutes":1},{"step":2,"text":"عرض تفاصيل المخالفات","duration_minutes":1}]', 
 ARRAY['رقم اللوحة المعدنية'], 'دقيقة واحدة', 0, NULL, '24/7 Digital'),

-- 3. NOTARY (التوثيق والشهر العقاري)
('توكيل رسمي عام', 'General Power of Attorney', 'تحرير توكيل رسمي عام لشخص آخر.', 'Issue a general power of attorney.', 'التوثيق', 'https://digital.gov.eg/notary/poa', 'Scale', 2.1, 'paper', 
 '[{"step":1,"text":"حجز موعد أونلاين","duration_minutes":2},{"step":2,"text":"الحضور والتوقيع","duration_minutes":15}]', 
 ARRAY['بطاقة الرقم القومي للموكل', 'بيانات الوكيل'], '1 ساعة', 55, '[{"lat": 30.0500, "lng": 31.2400, "name": "مكتب توثيق وسط القاهرة", "address": "لاظوغلي، وسط البلد", "accuracy": 1.0}]', '9:00 AM - 3:30 PM'),

('توكيل سيارة', 'Vehicle POA', 'توكيل خاص بإدارة وبيع مركبة.', 'Special power of attorney for vehicles.', 'التوثيق', 'https://digital.gov.eg/notary/car-poa', 'Car', 2.1, 'paper', 
 '[{"step":1,"text":"إدخال بيانات المركبة","duration_minutes":5},{"step":2,"text":"حجز الموعد","duration_minutes":2},{"step":3,"text":"التوثيق في المكتب","duration_minutes":10}]', 
 ARRAY['رخصة السيارة', 'بطاقة الرقم القومي'], '2 ساعة', 70, '[{"lat": 30.0400, "lng": 31.2500, "name": "مكتب توثيق ضواحي القاهرة", "address": "القاهرة", "accuracy": 0.8}]', '9:00 AM - 3:00 PM'),

-- 4. SUBSIDY (التموين)
('تفعيل بطاقة التموين', 'Activate Ration Card', 'تفعيل البطاقة واستلام الرقم السري.', 'Activate your food subsidy card.', 'التموين', 'https://digital.gov.eg/supply/activate', 'ShoppingBag', 0.5, 'paper', 
 '[{"step":1,"text":"طلب التفعيل","duration_minutes":2},{"step":2,"text":"استلام الكود على الموبايل","duration_minutes":1}]', 
 ARRAY['رقم البطاقة التموينية', 'الموبايل المسجل'], 'يوم واحد', 0, NULL, '24/7 Digital'),

('إضافة مواليد', 'Add Newborns', 'إضافة المواليد الجدد لبطاقة التموين.', 'Add new children to ration card.', 'التموين', 'https://digital.gov.eg/supply/add-newborn', 'Baby', 0.5, 'paper', 
 '[{"step":1,"text":"إدخال بيانات المولود","duration_minutes":5},{"step":2,"text":"رفع شهادة الميلاد المميكنة","duration_minutes":5}]', 
 ARRAY['شهادة ميلاد الطفل'], 'أسبوع', 0, NULL, '24/7 Digital'),

-- 5. SOCIAL INSURANCE (التأمينات)
('الاستعلام عن المعاش', 'Pension Inquiry', 'معرفة قيمة المعاش الشهري وموعد الصرف.', 'Check your monthly pension details.', 'التأمينات', 'https://digital.gov.eg/insurance/pension', 'DollarSign', 1.2, 'paper', 
 '[{"step":1,"text":"إدخال الرقم التأميني","duration_minutes":1},{"step":2,"text":"عرض البيانات","duration_minutes":1}]', 
 ARRAY['الرقم القومي'], 'دقيقة واحدة', 0, NULL, '24/7 Digital'),

-- 6. HOUSING (الإسكان)
('طلب وحدة سكنية', 'Housing Request', 'التقديم على شقق الإسكان الاجتماعي.', 'Apply for social housing units.', 'الإسكان', 'https://digital.gov.eg/housing/apply', 'Home', 5.0, 'transport', 
 '[{"step":1,"text":"سداد جدية الحجز","duration_minutes":15},{"step":2,"text":"رفع المستندات","duration_minutes":20},{"step":3,"text":"انتظار القرعة","duration_minutes":14400}]', 
 ARRAY['شهادة الدخل', 'عقد إيجار قديم/جديد'], 'شهر', 5000, '[{"lat": 30.0441, "lng": 31.2335, "name": "بنك التعمير والإسكان الرئيسي", "address": "الدقي", "accuracy": 0.9}]', '8:30 AM - 3:00 PM'),

-- 7. HEALTH (الصحة)
('حجز لقاح', 'Vaccine Booking', 'حجز مواعيد التطعيمات واللقاحات.', 'Book vaccination appointments.', 'الصحة', 'https://egvac.mohp.gov.eg/', 'Activity', 2.5, 'transport', 
 '[{"step":1,"text":"إدخال البيانات الأساسية","duration_minutes":5},{"step":2,"text":"اختيار مركز التطعيم","duration_minutes":2},{"step":3,"text":"استلام رسالة التأكيد","duration_minutes":5}]', 
 ARRAY['الرقم القومي'], 'يوم', 0, '[{"lat": 30.0450, "lng": 31.2300, "name": "مكتب صحة عابدين", "address": "القاهرة", "accuracy": 1.0}]', '8:00 AM - 8:00 PM'),

-- 8. EDUCATION (التعليم)
('نتائج الامتحانات', 'Exam Results', 'معرفة نتائج الشهادات التعليمية.', 'Check educational exam results.', 'التعليم', 'https://eduserv.cairo.gov.eg/Results', 'BookOpen', 0.1, 'energy', 
 '[{"step":1,"text":"إدخال رقم الجلوس","duration_minutes":1},{"step":2,"text":"عرض النتيجة","duration_minutes":1}]', 
 ARRAY['رقم الجلوس'], 'دقيقة', 0, NULL, '24/7 Digital'),

-- 9. PASSPORTS (الجوازات)
('إصدار جواز سفر', 'Passport Issuance', 'طلب استخراج جواز سفر مصري لأول مرة أو تجديد.', 'Apply for or renew Egyptian passport.', 'الجوازات', 'https://digital.gov.eg/passport/issue', 'Globe', 6.5, 'transport', 
 '[{"step":1,"text":"سداد الرسوم بالبنك","duration_minutes":15},{"step":2,"text":"تقديم الطلب بمصلحة الجوازات","duration_minutes":30},{"step":3,"text":"استلام الجواز بعد 3 أيام","duration_minutes":10}]', 
 ARRAY['بطاقة الرقم القومي', 'المؤهل الدراسي', 'الموقف من التجنيد'], '3 أيام', 375, '[{"lat": 30.0441, "lng": 31.2335, "name": "مجمع التحرير - الجوازات", "address": "ميدان التحرير", "accuracy": 1.0}]', '8:00 AM - 4:00 PM'),

-- 10. LABOR (العمل)
('كعب عمل', 'Labor Office Card', 'استخراج شهادة قيد العمل للتوظيف.', 'Issue labor office registration card.', 'العمل', 'https://digital.gov.eg/labor/card', 'Briefcase', 1.8, 'transport', 
 '[{"step":1,"text":"تقديم الرقم القومي","duration_minutes":5},{"step":2,"text":"استلام كعب العمل","duration_minutes":2}]', 
 ARRAY['بطاقة الرقم القومي', 'المؤهل الدراسي'], 'يوم', 0, '[{"lat": 30.0500, "lng": 31.2500, "name": "مكتب عمل النزهة", "address": "القاهرة", "accuracy": 0.7}]', '9:00 AM - 2:00 PM');

-- STEP 4: CLEANUP DUPLICATES IF ANY (using URL as key)
DELETE FROM government_services a USING (
      SELECT MIN(ctid) as keep_id, url
      FROM government_services
      GROUP BY url
      HAVING COUNT(*) > 1
) b
WHERE a.url = b.url AND a.ctid <> b.keep_id;

-- STEP 5: RE-ENABLE LIVE INTELLIGENCE TABLES
CREATE TABLE IF NOT EXISTS service_live_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES government_services(id) ON DELETE CASCADE,
  field TEXT NOT NULL, 
  new_value JSONB NOT NULL,
  source TEXT DEFAULT 'user', 
  confidence_score DECIMAL DEFAULT 0.5,
  verified_by_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES government_services(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'started',
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

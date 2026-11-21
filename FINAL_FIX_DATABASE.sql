-- ========================================================
-- 🏁 الحل النهائي والموحد لقاعدة البيانات
-- ========================================================

-- 1. حذف الجداول القديمة لتجنب تضارب الأنواع
DROP TABLE IF EXISTS service_live_updates CASCADE;
DROP TABLE IF EXISTS service_usage_logs CASCADE;
DROP TABLE IF EXISTS government_services CASCADE;

-- 2. إنشاء جدول الخدمات بنوع UUID موحد
CREATE TABLE government_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    category TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    icon TEXT DEFAULT 'Info',
    carbon_impact_kg DECIMAL DEFAULT 0,
    carbon_impact_type TEXT DEFAULT 'digital',
    steps JSONB DEFAULT '[]',
    required_documents TEXT[] DEFAULT '{}',
    estimated_time TEXT,
    fee_estimate DECIMAL DEFAULT 0,
    office_location JSONB DEFAULT '[]',
    working_hours TEXT,
    phone TEXT,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. إنشاء جداول الذكاء الحي (التوافق مع UUID)
CREATE TABLE service_live_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES government_services(id) ON DELETE CASCADE,
  field TEXT NOT NULL, 
  new_value JSONB NOT NULL,
  source TEXT DEFAULT 'user', 
  confidence_score DECIMAL DEFAULT 0.5,
  verified_by_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE service_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES government_services(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'started',
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. إدخال البيانات الضخمة (عينة شاملة)
INSERT INTO government_services 
(name_ar, name_en, description_ar, description_en, category, url, icon, carbon_impact_kg, carbon_impact_type, steps, required_documents, estimated_time, fee_estimate, office_location, working_hours) 
VALUES  
('تجديد رخصة السيارة', 'Vehicle License Renewal', 'تجديد رخصة تسيير المركبات أونلاين.', 'Renew your vehicle driving license online.', 'المرور', 'https://digital.gov.eg/traffic/renew-license', 'Car', 12.5, 'transport', '[{"step":1,"text":"فحص فني","duration_minutes":60}]', ARRAY['شهادة براءة ذمة'], '3 أيام', 1500, '[{"lat": 30.0675, "lng": 31.2903, "name": "مرور العباسية"}]', '9:00 AM - 4:00 PM'),
('إصدار شهادة ميلاد', 'Birth Certificate', 'استخراج شهادة ميلاد مميكنة.', 'Official birth certificate issuance.', 'الأحوال المدنية', 'https://digital.gov.eg/civil/birth-certificate', 'Baby', 0.8, 'paper', '[{"step":1,"text":"طلب إلكتروني"}]', ARRAY['الرقم القومي'], 'يوم عمل', 50, '[{"lat": 30.0444, "lng": 31.2357, "name": "سجل مدني العباسية"}]', '8:00 AM - 2:00 PM'),
('توكيل رسمي عام', 'General Power of Attorney', 'تحرير توكيل رسمي عام.', 'Issue a general power of attorney.', 'التوثيق', 'https://digital.gov.eg/notary/poa', 'Scale', 2.1, 'paper', '[{"step":1,"text":"حجز موعد"}]', ARRAY['بطاقة الرقم القومي'], '1 ساعة', 55, '[{"lat": 30.0500, "lng": 31.2400, "name": "توثيق وسط القاهرة"}]', '9:00 AM - 3:30 PM');

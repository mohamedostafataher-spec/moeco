-- GOV_ASSISTANT_SETUP.sql
CREATE TABLE IF NOT EXISTS government_services (
  id SERIAL PRIMARY KEY,
  name TEXT,
  category TEXT,
  description TEXT,
  estimated_time TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_steps (
  id SERIAL PRIMARY KEY,
  service_id INTEGER REFERENCES government_services(id),
  step_order INTEGER,
  step_text TEXT,
  required_documents TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_service_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  service_id INTEGER REFERENCES government_services(id),
  current_step INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  reminder_date TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_locations (
  id SERIAL PRIMARY KEY,
  service_id INTEGER REFERENCES government_services(id),
  name TEXT,
  address TEXT,
  working_hours TEXT
);

-- Basic Seeding
INSERT INTO government_services (name, category, description, estimated_time) VALUES
('استخراج بطاقة رقم قومي', 'Civil Status', 'خطوات استخراج بطاقة الرقم القومي لأول مرة أو تجديدها', '14 يوم عمل'),
('استخراج جواز سفر', 'Travel', 'استخراج جواز سفر مصري جديد مميكن', '7 أيام عمل'),
('رخصة قيادة خاصة', 'Traffic', 'استخراج رخصة قيادة خاصة لأول مرة', 'يوم واحد (بعد اجتياز الاختبار)'),
('شهادة ميلاد كمبيوتر', 'Civil Status', 'استخراج شهادة ميلاد مميكنة', 'نفس اليوم')
ON CONFLICT DO NOTHING;

-- Service 1: National ID
INSERT INTO service_steps (service_id, step_order, step_text, required_documents) VALUES
(1, 1, 'شراء استمارة الرقم القومي من السجل المدني أو البريد', ARRAY['لا يوجد']),
(1, 2, 'إحضار المستندات المطلوبة وإثبات المهنة أو السكن', ARRAY['استمارة الرقم القومي', 'صورة شهادة الميلاد', 'إيصال مرافق (كهرباء/مياه)', 'إثبات المهنة (إن وجد)']),
(1, 3, 'التصوير في السجل المدني التابع لمحل الإقامة وتسليم المستندات', ARRAY['المستندات المجهزة سابقاً']),
(1, 4, 'استلام البطاقة بعد انقضاء المدة المحددة للحصول عليها', ARRAY['إيصال التسليم'])
ON CONFLICT DO NOTHING;

-- Service 2: Passport
INSERT INTO service_steps (service_id, step_order, step_text, required_documents) VALUES
(2, 1, 'سحب استمارة جواز السفر من الجوازات', ARRAY['لا يوجد']),
(2, 2, 'تجهيز المستندات المطلوبة والصور الشخصية', ARRAY['استمارة جواز السفر', 'بطاقة الرقم القومي سارية', '3 صور شخصية 4x6 خلفية بيضاء', 'شهادة التجنيد (للذكور)', 'المؤهل الدراسي (في حال عدم ثبوته بالبطاقة)']),
(2, 3, 'التوجه لمكتب الجوازات التابع لمحل الإقامة وتقديم الطلب', ARRAY['جميع المستندات المذكورة']),
(2, 4, 'استلام جواز السفر', ARRAY['إيصال الاستلام'])
ON CONFLICT DO NOTHING;

-- Service 3: Driving License
INSERT INTO service_steps (service_id, step_order, step_text, required_documents) VALUES
(3, 1, 'الكشف الطبي (باطنة ونظر) بوحدة المرور', ARRAY['بطاقة الرقم القومي سارية', 'صورتين شخصيتين 4x6']),
(3, 2, 'شراء ملف التقديم وإحضار شهادة المخالفات', ARRAY['نموذج كشف طبي', 'شهادة براءة ذمة (إن وجد)']),
(3, 3, 'اجتياز الاختبار النظري والعملي', ARRAY['ملف التقديم']),
(3, 4, 'التصوير لاستخراج الرخصة واستلامها', ARRAY['إيصال سداد الرسوم'])
ON CONFLICT DO NOTHING;

-- Locations
INSERT INTO service_locations (service_id, name, address, working_hours) VALUES
(1, 'سجل مدني العباسية', 'العباسية، القاهرة', '8 ص - 2 م'),
(1, 'سجل مدني مصر الجديدة', 'أمام محكمة مصر الجديدة', '8 ص - 2 م / 3 م - 9 م'),
(2, 'مجمع التحرير (سابقاً) / جوازات العباسية', 'كلية الشرطة القديمة بالعباسية', '8 ص - 2 م'),
(3, 'مرور مدينة نصر', 'آخر مصطفى النحاس', '8 ص - 2 م')
ON CONFLICT DO NOTHING;

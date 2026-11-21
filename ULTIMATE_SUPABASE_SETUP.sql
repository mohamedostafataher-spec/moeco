-- ========================================================
-- 🏁 ULTIMATE REAL-TIME PLATFORM SCHEMA
-- =-- Handles News, Alerts, Government Services, and Real-time Intelligence
-- ========================================================

-- 1. DROP OLD CONFLICTING TABLES
DROP TABLE IF EXISTS service_live_updates CASCADE;
DROP TABLE IF EXISTS service_usage_logs CASCADE;
DROP TABLE IF EXISTS government_services CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- 2. DYNAMIC GOVERNMENT SERVICES (UUID BASED)
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
    carbon_impact_type TEXT DEFAULT 'digital', -- digital, transport, paper, energy
    steps JSONB DEFAULT '[]', -- [{step: 1, text_ar: "...", text_en: "...", duration: 10}]
    required_documents JSONB DEFAULT '[]', -- [{name_ar: "...", name_en: "...", type: "file"}]
    fees JSONB DEFAULT '[]', -- [{name_ar: "...", name_en: "...", amount: 100}]
    office_locations JSONB DEFAULT '[]', -- [{name: "...", lat: 0, lng: 0}]
    working_hours TEXT,
    phone TEXT,
    request_template_ar TEXT,
    request_template_en TEXT,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INTELLIGENT NEWS ENGINE
CREATE TABLE news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    content_ar TEXT,
    content_en TEXT,
    source_url TEXT UNIQUE,
    image_url TEXT,
    category TEXT DEFAULT 'environment',
    sentiment_score DECIMAL DEFAULT 0, -- AI analyzed sentiment
    is_emergency BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. EMERGENCY ALERT SYSTEM (FIFO QUEUE TARGET)
CREATE TABLE alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    news_id UUID REFERENCES news(id) ON DELETE SET NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    category TEXT, -- fire, war, flood, health, etc.
    location JSONB, -- Geo-fencing support
    is_active BOOLEAN DEFAULT TRUE,
    instructions_ar TEXT,
    instructions_en TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ISOLATED SERVICE CHAT
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID REFERENCES government_services(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_ai BOOLEAN DEFAULT FALSE,
    room_id TEXT NOT NULL, -- Computed: user_id + service_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. LIVE DATA UPDATE ENGINE (User Suggestions)
CREATE TABLE service_live_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID REFERENCES government_services(id) ON DELETE CASCADE,
    field TEXT NOT NULL, 
    new_value JSONB NOT NULL,
    source_user_id UUID REFERENCES auth.users(id),
    confidence_score DECIMAL DEFAULT 0.5,
    verified_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending', -- pending, merged, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SEEDING INITIAL REAL DATA
INSERT INTO government_services (name_ar, name_en, category, url, icon, carbon_impact_kg, carbon_impact_type, steps, fees, request_template_ar)
VALUES 
('تجديد جواز السفر', 'Passport Renewal', 'الجوازات', 'https://digital.gov.eg/passports', 'Globe', 6.5, 'transport', 
 '[{"step": 1, "text_ar": "سداد الرسوم", "text_en": "Pay Fees", "duration": 15}]',
 '[{"name_ar": "رسوم استخراج", "amount": 375}]',
 'السيد مدير مصلحة الجوازات، أرجو التكرم بالموافقة على تجديد جواز سفري رقم {passport_no}...'),
('شهادة ميلاد رقمية', 'Digital Birth Certificate', 'الأحوال المدنية', 'https://digital.gov.eg/civil/birth', 'Baby', 0.8, 'paper', 
 '[{"step": 1, "text_ar": "إدخال الرقم القومي", "text_en": "Enter National ID"}]',
 '[{"name_ar": "رسوم الشهادة", "amount": 50}]',
 'أطلب استخراج شهادة ميلاد لـ {name}...')
;

INSERT INTO news (title_ar, title_en, content_ar, content_en, category, is_emergency)
VALUES 
('تحذير من عاصفة ترابية قادمة', 'Dust Storm Warning', 'توقعات بهبوب عواصف ترابية على القاهرة والجيزة...', 'Expect dust storms hitting Cairo and Giza...', 'Weather', TRUE);

INSERT INTO alerts (title_ar, title_en, description_ar, description_en, severity, category, is_active)
VALUES 
('🚨 حالة طوارئ قصوى: عاصفة رملية', '🚨 URGENT: Sandstorm Emergency', 'يرجى البقاء في المنازل وإغلاق النوافذ فوراً.', 'Please stay indoors and close windows immediately.', 'high', 'weather', TRUE);

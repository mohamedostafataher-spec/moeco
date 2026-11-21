-- 🇪🇬 المهام الوطنية (National Missions)
CREATE TABLE IF NOT EXISTS national_missions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  mission_type TEXT,
  target_value INTEGER DEFAULT 0,
  reward_points INTEGER DEFAULT 0,
  governorate TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mission_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES national_missions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🏛️ مركز المواطن (Citizen Center)
CREATE TABLE IF NOT EXISTS citizen_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name_ar TEXT NOT NULL,
  service_name_en TEXT NOT NULL,
  category TEXT,
  required_documents_ar TEXT[],
  required_documents_en TEXT[],
  fees DECIMAL DEFAULT 0,
  office_location_ar TEXT,
  office_location_en TEXT,
  service_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS citizen_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES citizen_services(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  tracking_code TEXT,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📚 بوابات الموارد (Resource Gateways)
CREATE TABLE IF NOT EXISTS eco_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  category TEXT,
  content_ar TEXT,
  content_en TEXT,
  resource_type TEXT, -- 'video', 'article', 'guide'
  external_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Realtime enablement
ALTER PUBLICATION supabase_realtime ADD TABLE national_missions;
ALTER PUBLICATION supabase_realtime ADD TABLE mission_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE citizen_services;
ALTER PUBLICATION supabase_realtime ADD TABLE citizen_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE eco_resources;

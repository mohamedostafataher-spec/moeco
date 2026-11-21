-- RE-INITIALIZE TRANSPORT TABLES WITH ALL NECESSARY COLUMNS
DROP TABLE IF EXISTS public.transport_services CASCADE;

CREATE TABLE public.transport_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    type TEXT NOT NULL, -- 'metro', 'bus', 'monorail', 'lrt', 'hst', 'tram', 'river-bus'
    line_code TEXT,
    stops TEXT[], -- Ordered station/stop names
    current_location JSONB, -- {lat, lng}
    status TEXT DEFAULT 'active',
    capacity INTEGER,
    occupancy_percent INTEGER DEFAULT 0,
    current_station_ar TEXT,
    current_station_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.utility_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sector TEXT NOT NULL, -- 'monorail', 'lrt', 'metro', 'water', 'electricity'
    tier_name TEXT,
    min NUMERIC DEFAULT 0,
    max NUMERIC,
    price NUMERIC NOT NULL,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'trip', 'location', 'service'
    value NUMERIC,
    carbon NUMERIC,
    lat FLOAT,
    lng FLOAT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consumption_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sector TEXT NOT NULL,
    type TEXT,
    co2 NUMERIC DEFAULT 0,
    title_ar TEXT,
    title_en TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_transport_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    from_location TEXT,
    to_location TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED DATA FOR TRANSPORT SERVICES
INSERT INTO public.transport_services (name, name_ar, type, line_code, stops, current_location, current_station_ar, current_station_en)
VALUES 
('Metro Line 1', 'مترو الخط الأول', 'metro', 'line-1', ARRAY['Helwan', 'Ain Helwan', 'Maadi', 'Sadat', 'Ramses', 'Marg'], '{"lat": 30.0444, "lng": 31.2357}', 'السادات', 'Sadat'),
('Metro Line 2', 'مترو الخط الثاني', 'metro', 'line-2', ARRAY['Shobra', 'Ramses', 'Ataba', 'Sadat', 'Giza', 'Mounib'], '{"lat": 30.0636, "lng": 31.2467}', 'رمسيس', 'Ramses'),
('Metro Line 3', 'مترو الخط الثالث', 'metro', 'line-3', ARRAY['Adly Mansour', 'Heliopolis', 'Abbassiya', 'Ataba', 'Kit Kat'], '{"lat": 30.0519, "lng": 31.2464}', 'العتبة', 'Ataba'),
('Monorail East', 'مونوريل شرق النيل', 'monorail', 'monorail-east', ARRAY['Stadium', 'New Cairo', 'Administrative Capital'], '{"lat": 30.0712, "lng": 31.3258}', 'الاستاد', 'Stadium'),
('LRT', 'القطار الكهربائي الخفيف', 'lrt', 'lrt-1', ARRAY['Adly Mansour', 'Obour', 'Shorouk', 'Capital'], '{"lat": 30.1466, "lng": 31.4228}', 'عدلي منصور', 'Adly Mansour'),
('Bus 100', 'أتوبيس النقل العام 100', 'bus', 'bus-100', ARRAY['Imbaba', 'Zamalek', 'Tahrir', 'Abbassiya'], '{"lat": 30.0652, "lng": 31.2129}', 'التحرير', 'Tahrir');

-- SEED DATA FOR PRICING
INSERT INTO public.utility_tiers (sector, min, max, price)
VALUES 
('monorail', 0, 5, 20),
('monorail', 6, 10, 40),
('monorail', 11, 15, 55),
('monorail', 16, 999, 80);

-- POLICIES
ALTER TABLE public.transport_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view transport" ON public.transport_services FOR SELECT USING (true);

ALTER TABLE public.utility_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view pricing" ON public.utility_tiers FOR SELECT USING (true);

ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON public.usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.usage FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own consumption" ON public.consumption_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consumption" ON public.consumption_records FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_transport_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own history" ON public.user_transport_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.user_transport_history FOR INSERT WITH CHECK (auth.uid() = user_id);

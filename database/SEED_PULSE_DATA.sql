
-- 1. Create Environmental Pulse Zones Table
CREATE TABLE IF NOT EXISTS public.environmental_pulse_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lat FLOAT8 NOT NULL,
    lng FLOAT8 NOT NULL,
    radius FLOAT8 DEFAULT 500,
    type TEXT CHECK (type IN ('traffic', 'aqi', 'noise', 'eco', 'heat')),
    status_ar TEXT,
    status_en TEXT,
    advice_ar TEXT,
    advice_en TEXT,
    color TEXT DEFAULT 'blue',
    intensity FLOAT8 DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.environmental_pulse_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read zones" ON public.environmental_pulse_zones FOR SELECT USING (true);

-- 2. Seed some Pulse Zones (around common coordinates or if we had a user location, but let's use generic ones for Cairo/Egypt)
INSERT INTO public.environmental_pulse_zones (lat, lng, radius, type, status_ar, status_en, advice_ar, advice_en, color, intensity)
VALUES 
(30.0444, 31.2357, 1000, 'aqi', 'جودة هواء متوسطة', 'Moderate Air Quality', 'قد ترغب في تقليل النشاط الخارجي الطويل', 'Consider reducing prolonged outdoor activity', 'amber', 0.6),
(30.0470, 31.2390, 600, 'traffic', 'زحام شديد في وسط البلد', 'Heavy Traffic in Downtown', 'استخدم المترو أو طرقاً بديلة', 'Use Metro or alternate routes', 'red', 0.9),
(30.0510, 31.2450, 800, 'eco', 'منطقة خضراء نشطة', 'Active Green Zone', 'مكان مثالي للمشي والرياضة', 'Perfect for walking and exercise', 'emerald', 0.1),
(30.0600, 31.2200, 700, 'heat', 'جزيرة حرارية مرتفعة', 'High Urban Heat Island', 'تجنب المشي تحت الشمس المباشرة', 'Avoid walking under direct sun', 'orange', 0.8)
ON CONFLICT DO NOTHING;

-- 3. Seed some Environmental Reports
INSERT INTO public.environmental_reports (user_id, title, description, category, location_lat, location_lng, status)
SELECT 
    id as user_id,
    'تراكم مخلفات في المنيل' as title,
    'يوجد تراكم كبير للمخلفات البلاستيكية بالقرب من النيل' as description,
    'garbage' as category,
    30.0200 as location_lat,
    31.2250 as location_lng,
    'Pending' as status
FROM public.users LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.environmental_reports (user_id, title, description, category, location_lat, location_lng, status)
SELECT 
    id as user_id,
    'Water Leakage' as title,
    'Major water pipe burst on 9th street' as description,
    'water_pollution' as category,
    30.0400 as location_lat,
    31.2400 as location_lng,
    'Investigating' as status
FROM public.users LIMIT 1
ON CONFLICT DO NOTHING;

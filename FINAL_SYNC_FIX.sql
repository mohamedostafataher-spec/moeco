-- ========================================================
--  ULTIMATE FIX: TABLES & PERMISSIONS & RLS FOR SYNC
-- ========================================================

-- 1. Create Core Missing Tables (IF NOT EXISTS to be safe)

CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content TEXT,
    description TEXT,
    url TEXT,
    image_url TEXT,
    source TEXT,
    category TEXT,
    author TEXT,
    published_at TIMESTAMPTZ,
    language TEXT,
    target_screen TEXT,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.eco_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content TEXT,
    description TEXT,
    url TEXT,
    image_url TEXT,
    source TEXT,
    category TEXT,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT,
    title_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    type TEXT,
    severity TEXT,
    location_id TEXT,
    radius_km NUMERIC,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.eco_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    message TEXT,
    type TEXT,
    severity TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rss_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    url TEXT,
    category TEXT,
    language TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scientific_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE,
    category TEXT,
    value NUMERIC,
    unit TEXT,
    source TEXT,
    year INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    transport_mode TEXT,
    distance NUMERIC,
    carbon_saved NUMERIC,
    points_earned NUMERIC,
    amount_paid NUMERIC,
    ticket_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add missing columns just in case
ALTER TABLE public.scientific_data ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.scientific_data ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.carbon_activities ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;

-- 3. GRANT PERMISSIONS (Fix "Permission Denied")
GRANT ALL ON public.news TO anon, authenticated, service_role;
GRANT ALL ON public.eco_news TO anon, authenticated, service_role;
GRANT ALL ON public.alerts TO anon, authenticated, service_role;
GRANT ALL ON public.eco_alerts TO anon, authenticated, service_role;
GRANT ALL ON public.scientific_data TO anon, authenticated, service_role;
GRANT ALL ON public.transport_logs TO anon, authenticated, service_role;
GRANT ALL ON public.rss_sources TO anon, authenticated, service_role;
GRANT ALL ON public.carbon_activities TO anon, authenticated, service_role;

-- 4. ENABLE RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eco_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eco_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scientific_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_activities ENABLE ROW LEVEL SECURITY;

-- 5. CREATE OPEN RLS POLICIES FOR SYNC
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'news' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.news FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'eco_news' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.eco_news FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.alerts FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'eco_alerts' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.eco_alerts FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scientific_data' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.scientific_data FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transport_logs' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.transport_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rss_sources' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.rss_sources FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carbon_activities' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.carbon_activities FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

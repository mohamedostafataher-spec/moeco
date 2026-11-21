-- Fix missing tables, columns and permissions

DROP TABLE IF EXISTS public.matches;

CREATE TABLE IF NOT EXISTS public.matches (
  match_id TEXT PRIMARY KEY,
  team_home TEXT,
  team_away TEXT,
  league TEXT,
  date TEXT,
  time TEXT,
  status TEXT,
  score TEXT,
  source TEXT,
  stadium TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grant permissions for matches
GRANT ALL ON public.matches TO anon, authenticated, service_role;

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS iframe_compatible BOOLEAN DEFAULT true;

ALTER TABLE public.carbon_activities ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;

-- Grant permissions to fix "permission denied"
GRANT ALL ON public.gov_services TO anon, authenticated, service_role;
GRANT ALL ON public.carbon_activities TO anon, authenticated, service_role;

-- Allow RLS if enabled
ALTER TABLE public.gov_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create blanket permissive policies for development
DO $$ 
BEGIN
  -- gov_services
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gov_services' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.gov_services FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- carbon_activities
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carbon_activities' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.carbon_activities FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- matches
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'matches' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.matches FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- coupons
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

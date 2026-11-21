-- Fix missing calculator tables and permissions

CREATE TABLE IF NOT EXISTS public.consumption_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    sector TEXT,
    value NUMERIC,
    unit TEXT,
    co2_impact NUMERIC,
    description TEXT,
    source TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    amount NUMERIC,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    sector TEXT,
    previous_reading NUMERIC,
    current_reading NUMERIC,
    consumption NUMERIC,
    bill_amount NUMERIC,
    tier NUMERIC,
    carbon_footprint NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grant permissions for new tables
GRANT ALL ON public.consumption_records TO anon, authenticated, service_role;
GRANT ALL ON public.point_transactions TO anon, authenticated, service_role;
GRANT ALL ON public.bills TO anon, authenticated, service_role;

-- Allow RLS if enabled
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Create blanket permissive policies for development
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consumption_records' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.consumption_records FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'point_transactions' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.point_transactions FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bills' AND policyname = 'Enable all for anon') THEN
    CREATE POLICY "Enable all for anon" ON public.bills FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
END $$;

NOTIFY pgrst, 'reload schema';

-- FIX TRANSPORT LOGS SCHEMA TO MATCH CODE EXPECTATIONS
ALTER TABLE public.transport_logs RENAME COLUMN transport_mode TO transport_type;
ALTER TABLE public.transport_logs RENAME COLUMN distance TO distance_km;
ALTER TABLE public.transport_logs RENAME COLUMN carbon_saved TO carbon_footprint;
ALTER TABLE public.transport_logs ADD COLUMN IF NOT EXISTS cost NUMERIC;
ALTER TABLE public.transport_logs ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE public.transport_logs ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE public.transport_logs ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Ensure RLS is open as per ULTIMATE_FIX
GRANT ALL ON public.transport_logs TO anon, authenticated, service_role;
ALTER TABLE public.transport_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for everyone" ON public.transport_logs FOR ALL USING (true) WITH CHECK (true);

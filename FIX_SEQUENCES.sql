
-- First, list sequences to be sure of their names
-- This script will fix the permissions for the confirmed sequences:
-- consumption_records_id_seq
-- carbon_activities_id_seq

-- Ensure the sequences exist (they should, but this makes it robust)
CREATE SEQUENCE IF NOT EXISTS public.consumption_records_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.carbon_activities_id_seq;

-- Give standard permissions to authenticated users and anonymous access
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.consumption_records_id_seq TO authenticated;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.carbon_activities_id_seq TO authenticated;

-- Also for anon if needed (common in some Supabase setups)
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.consumption_records_id_seq TO anon;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.carbon_activities_id_seq TO anon;

-- Ensure tables themselves are accessible
GRANT ALL ON TABLE public.consumption_records TO authenticated;
GRANT ALL ON TABLE public.carbon_activities TO authenticated;
GRANT ALL ON TABLE public.consumption_records TO anon;
GRANT ALL ON TABLE public.carbon_activities TO anon;

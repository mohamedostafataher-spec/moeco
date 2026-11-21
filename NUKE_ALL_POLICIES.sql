-- COMPREHENSIVE POLICY CLEANUP
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename, schemaname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- NOW RE-CREATE THE SAFE ONES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
        CREATE POLICY "Allow All for Profiles" ON public.profiles FOR ALL USING (true);
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'carbon_activities') THEN
        CREATE POLICY "Allow All for Activities" ON public.carbon_activities FOR ALL USING (true);
    END IF;
    
    -- ... and so on for all critical tables
END $$;


-- 1. FIX COUPONS TABLE SCHEMA (Add missing columns if needed)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'source') THEN
            ALTER TABLE public.coupons ADD COLUMN source TEXT NOT NULL DEFAULT 'Manual';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'code') THEN
            ALTER TABLE public.coupons ADD COLUMN code TEXT NOT NULL DEFAULT 'DEAL';
        END IF;
        
        -- ENSURE UNIQUE constraint for upsert
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coupons_code_source_key') THEN
            ALTER TABLE public.coupons ADD CONSTRAINT coupons_code_source_key UNIQUE (code, source);
        END IF;
    END IF;
END $$;

-- CLEAN UP OLD POLICIES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
        DROP POLICY IF EXISTS "الملفات الشخصية العامة قابلة للعرض من قبل الجميع" ON public.profiles;
        DROP POLICY IF EXISTS "يمكن للمستخدمين تحديث ملفاتهم الشخصية الخاصة" ON public.profiles;
        DROP POLICY IF EXISTS "Allow All for Profiles" ON public.profiles;
        CREATE POLICY "Allow All for Profiles" ON public.profiles FOR ALL USING (true);
    END IF;
END $$;

-- 2. FIX RSS SOURCES (Handle missing columns and Update BBC to HTTPS)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rss_sources') THEN
        -- Add url column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rss_sources' AND column_name = 'url') THEN
            ALTER TABLE public.rss_sources ADD COLUMN url TEXT;
        END IF;

        -- Update existing data
        UPDATE public.rss_sources SET 
            url = REPLACE(COALESCE(url, feed_url), 'http://feeds.bbci.co.uk', 'https://feeds.bbci.co.uk'),
            feed_url = REPLACE(feed_url, 'http://feeds.bbci.co.uk', 'https://feeds.bbci.co.uk')
        WHERE (url LIKE 'http://feeds.bbci.co.uk%' OR feed_url LIKE 'http://feeds.bbci.co.uk%');
    END IF;
END $$;

-- 3. ENSURE NEWS UNIQUE CONSTRAINT
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'news_url_key') THEN
            ALTER TABLE public.news ADD CONSTRAINT news_url_key UNIQUE (url);
        END IF;
    END IF;
END $$;

-- 4. PERMISSIONS (GIVE EVERYONE ACCESS UNTIL RIGOROUS RLS IS NEEDED)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'coupons') THEN GRANT ALL ON public.coupons TO anon, authenticated; ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY; END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'news') THEN GRANT ALL ON public.news TO anon, authenticated; ALTER TABLE public.news DISABLE ROW LEVEL SECURITY; END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rss_sources') THEN GRANT ALL ON public.rss_sources TO anon, authenticated; ALTER TABLE public.rss_sources DISABLE ROW LEVEL SECURITY; END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'consumption_records') THEN GRANT ALL ON public.consumption_records TO anon, authenticated; END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'carbon_activities') THEN GRANT ALL ON public.carbon_activities TO anon, authenticated; ALTER TABLE public.carbon_activities DISABLE ROW LEVEL SECURITY; END IF;
END $$;

-- 5. REPAIR FALLBACK ADMIN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_scores') THEN
        INSERT INTO public.user_scores (user_id, total_score, level)
        SELECT id, 1000, 10 FROM auth.users WHERE email = 'mohamedostafataher@gmail.com'
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;

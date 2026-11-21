
-- ==========================================
-- MOECO FINAL SYSTEM RECOVERY 2026
-- ==========================================

-- 1. NEWS SYSTEM RECOVERY
DO $$ 
BEGIN
    -- Ensure news table uses standard names
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'news') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'news_url_key') THEN
            ALTER TABLE public.news ADD CONSTRAINT news_url_key UNIQUE (url);
        END IF;
    END IF;

    -- Ensure rss_sources has a unique feed_url
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rss_sources') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rss_sources_feed_url_key') THEN
            ALTER TABLE public.rss_sources ADD CONSTRAINT rss_sources_feed_url_key UNIQUE (feed_url);
        END IF;
    END IF;
END $$;

-- 2. CALCULATOR & HISTORY RECOVERY
DO $$
BEGIN
    -- consumption_records: Ensure co2_impact and metadata exists (standard schema)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumption_records' AND column_name = 'co2_impact') THEN
        ALTER TABLE public.consumption_records ADD COLUMN co2_impact FLOAT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumption_records' AND column_name = 'metadata') THEN
        ALTER TABLE public.consumption_records ADD COLUMN metadata JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carbon_activities' AND column_name = 'metadata') THEN
        ALTER TABLE public.carbon_activities ADD COLUMN metadata JSONB;
    END IF;

    -- Update legacy data if any
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumption_records' AND column_name = 'metadata') THEN
        UPDATE public.consumption_records 
        SET co2_impact = COALESCE(co2_impact, (metadata->>'co2_impact')::float)
        WHERE co2_impact IS NULL AND metadata ? 'co2_impact';
    END IF;

    -- Permissive RLS for Citizen Features (Safety First)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'consumption_records') THEN EXECUTE 'ALTER TABLE public.consumption_records DISABLE ROW LEVEL SECURITY'; END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'carbon_activities') THEN EXECUTE 'ALTER TABLE public.carbon_activities DISABLE ROW LEVEL SECURITY'; END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'news') THEN EXECUTE 'ALTER TABLE public.news DISABLE ROW LEVEL SECURITY'; END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rss_sources') THEN EXECUTE 'ALTER TABLE public.rss_sources DISABLE ROW LEVEL SECURITY'; END IF;
    
    -- Grant permissions and sequences
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'consumption_records') THEN 
        EXECUTE 'GRANT ALL ON public.consumption_records TO anon, authenticated';
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'consumption_records_id_seq') THEN
            EXECUTE 'GRANT USAGE, SELECT, UPDATE ON SEQUENCE consumption_records_id_seq TO anon, authenticated';
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'carbon_activities') THEN 
        EXECUTE 'GRANT ALL ON public.carbon_activities TO anon, authenticated'; 
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'carbon_activities_id_seq') THEN
            EXECUTE 'GRANT USAGE, SELECT, UPDATE ON SEQUENCE carbon_activities_id_seq TO anon, authenticated';
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'news') THEN 
        EXECUTE 'GRANT ALL ON public.news TO anon, authenticated'; 
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'news_id_seq') THEN
            EXECUTE 'GRANT USAGE, SELECT, UPDATE ON SEQUENCE news_id_seq TO anon, authenticated';
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rss_sources') THEN 
        EXECUTE 'GRANT ALL ON public.rss_sources TO anon, authenticated'; 
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'rss_sources_id_seq') THEN
            EXECUTE 'GRANT USAGE, SELECT, UPDATE ON SEQUENCE rss_sources_id_seq TO anon, authenticated';
        END IF;
    END IF;
END $$;

-- 3. SYNC RSS SOURCES (BBC HTTPS FIX)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rss_sources') THEN
        EXECUTE 'UPDATE public.rss_sources 
        SET 
          url = REPLACE(COALESCE(url, feed_url), ''http://feeds.bbci.co.uk'', ''https://feeds.bbci.co.uk''),
          feed_url = REPLACE(feed_url, ''http://feeds.bbci.co.uk'', ''https://feeds.bbci.co.uk'')
        WHERE feed_url LIKE ''http://feeds.bbci.co.uk%''';
    END IF;
END $$;

-- 4. CLEAN UP DUPLICATE NEWS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'news') THEN
        EXECUTE 'DELETE FROM public.news 
        WHERE id IN (
            SELECT id FROM (
                SELECT id, row_number() OVER (PARTITION BY url ORDER BY created_at DESC) as rnum 
                FROM public.news
            ) t WHERE t.rnum > 1
        )';
    END IF;
END $$;

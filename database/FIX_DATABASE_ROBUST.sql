-- Robust Database Fix
DO $$
BEGIN
    -- 1. Ensure Table consumption_records exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consumption_records') THEN
        
        -- Add co2_impact if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumption_records' AND column_name = 'co2_impact') THEN
            EXECUTE 'ALTER TABLE public.consumption_records ADD COLUMN co2_impact FLOAT';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consumption_records' AND column_name = 'metadata') THEN
            EXECUTE 'ALTER TABLE public.consumption_records ADD COLUMN metadata JSONB';
        END IF;

        EXECUTE 'GRANT ALL ON public.consumption_records TO anon, authenticated';
        
        -- Try granting sequence if it exists
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'consumption_records_id_seq') THEN
            EXECUTE 'GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.consumption_records_id_seq TO anon, authenticated';
        END IF;
    END IF;

    -- 2. Carbon Activities
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'carbon_activities') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carbon_activities' AND column_name = 'metadata') THEN
            EXECUTE 'ALTER TABLE public.carbon_activities ADD COLUMN metadata JSONB';
        END IF;

        EXECUTE 'GRANT ALL ON public.carbon_activities TO anon, authenticated';
        
        -- Check for sequence 'carbon_activities_id_seq'
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'carbon_activities_id_seq') THEN
            EXECUTE 'GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.carbon_activities_id_seq TO anon, authenticated';
        END IF;
    END IF;

    -- 3. RSS Sources
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rss_sources') THEN
        EXECUTE 'UPDATE public.rss_sources 
        SET 
          url = REPLACE(COALESCE(url, feed_url), ''http://feeds.bbci.co.uk'', ''https://feeds.bbci.co.uk''),
          feed_url = REPLACE(feed_url, ''http://feeds.bbci.co.uk'', ''https://feeds.bbci.co.uk'')
        WHERE feed_url LIKE ''http://feeds.bbci.co.uk%''';
    END IF;

    -- 4. CLEAN UP DUPLICATE NEWS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'news') THEN
        EXECUTE 'DELETE FROM public.news 
        WHERE id IN (
            SELECT id FROM (
                SELECT id, row_number() OVER (PARTITION BY url ORDER BY created_at DESC) as rnum 
                FROM public.news
            ) t WHERE t.rnum > 1
        )';
        
        -- Also add RSS constraints here if missing
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'news_url_key') THEN
            EXECUTE 'ALTER TABLE public.news ADD CONSTRAINT news_url_key UNIQUE (url)';
        END IF;
    END IF;

    -- Ensure rss_sources has a unique feed_url
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rss_sources') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rss_sources_feed_url_key') THEN
           EXECUTE 'ALTER TABLE public.rss_sources ADD CONSTRAINT rss_sources_feed_url_key UNIQUE (feed_url)';
        END IF;
    END IF;
    
    -- 5. News and RSS Permissions
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'news') THEN
        EXECUTE 'GRANT ALL ON public.news TO anon, authenticated';
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'news_id_seq') THEN
            EXECUTE 'GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.news_id_seq TO anon, authenticated';
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rss_sources') THEN
        EXECUTE 'GRANT ALL ON public.rss_sources TO anon, authenticated';
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'rss_sources_id_seq') THEN
            EXECUTE 'GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.rss_sources_id_seq TO anon, authenticated';
        END IF;
    END IF;
END $$;

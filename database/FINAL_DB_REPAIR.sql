-- 1. Fix app_config
DO $$
BEGIN
    -- Ensure table exists
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'app_config') THEN
        CREATE TABLE public.app_config (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            config_key TEXT UNIQUE NOT NULL,
            config_value JSONB NOT NULL,
            description TEXT,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Ensure columns exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_config' AND column_name='description') THEN
            ALTER TABLE public.app_config ADD COLUMN description TEXT;
        END IF;
    END IF;
END $$;

-- 2. Fix coupons table to include 'source' and others
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'coupons') THEN
         CREATE TABLE public.coupons (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            code TEXT NOT NULL,
            source TEXT,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='source') THEN
            ALTER TABLE public.coupons ADD COLUMN source TEXT;
        END IF;
    END IF;
END $$;

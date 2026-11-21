-- Final comprehensive fix for gov_services table columns
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gov_services') THEN
        -- Add missing columns if they don't exist
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS name_en TEXT;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS name_ar TEXT;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS description_en TEXT;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS description_ar TEXT;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS category TEXT;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS icon TEXT;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS url TEXT;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS carbon_impact_type TEXT;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS requirements_ar TEXT[];
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS requirements_en TEXT[];
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS fees NUMERIC DEFAULT 0;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS is_smart BOOLEAN DEFAULT FALSE;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS iframe_compatible BOOLEAN DEFAULT FALSE;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS source TEXT;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

        -- Ensure unique constraint on URL if needed
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gov_services_url_key') THEN
            -- Only add if it's not already there and doesn't conflict with existing data
            BEGIN
                ALTER TABLE public.gov_services ADD CONSTRAINT gov_services_url_key UNIQUE (url);
            EXCEPTION WHEN others THEN
                RAISE NOTICE 'Could not add unique constraint on url - likely duplicates exist';
            END;
        END IF;
    END IF;
END $$;

-- Verify if economy_data exists
CREATE TABLE IF NOT EXISTS public.economy_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    indicator TEXT,
    value NUMERIC,
    unit TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verify if point_transactions exists
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MOECO DATABASE FIXES (SCHEMA REPAIR)
-- ============================================

-- 1. Fix gov_services table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gov_services') THEN
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS is_smart BOOLEAN DEFAULT FALSE;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS carbon_impact_type TEXT;
        ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS fees NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 2. Ensure matches table exists
CREATE TABLE IF NOT EXISTS public.matches (
    match_id TEXT PRIMARY KEY,
    team_home TEXT NOT NULL,
    team_away TEXT NOT NULL,
    league TEXT,
    date DATE,
    time TEXT,
    status TEXT,
    score TEXT,
    source TEXT,
    stadium TEXT,
    attendance INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure coupons table exists
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    discount TEXT,
    expiry_date TIMESTAMP WITH TIME ZONE,
    source TEXT,
    link TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(code, source)
);

-- 4. Re-verify is_active in news_categories
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_categories') THEN
        ALTER TABLE public.news_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 5. Enable Realtime for all fixed tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.gov_services;

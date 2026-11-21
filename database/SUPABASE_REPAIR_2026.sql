-- Database Repair Script for MOECO (2026)
-- Run this in your Supabase SQL Editor

-- 1. Ensure matches table exists with correct schema
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

-- 2. Ensure coupons table has the category column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons') THEN
        CREATE TABLE public.coupons (
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
    ELSE
        ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS category TEXT;
        ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    END IF;
END $$;

-- 3. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.coupons;

-- 4. Set Permissions
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public matches are viewable by everyone" ON public.matches;
CREATE POLICY "Public matches are viewable by everyone" ON public.matches FOR SELECT USING (true);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public coupons are viewable by everyone" ON public.coupons;
CREATE POLICY "Public coupons are viewable by everyone" ON public.coupons FOR SELECT USING (true);

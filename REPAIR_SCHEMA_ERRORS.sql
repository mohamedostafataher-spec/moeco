-- Fix public.news
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    url TEXT UNIQUE NOT NULL,
    image_url TEXT,
    source TEXT,
    source_url TEXT,
    category TEXT DEFAULT 'general',
    target_screen TEXT DEFAULT 'eco_news',
    priority TEXT DEFAULT 'normal',
    is_alert BOOLEAN DEFAULT false,
    alert_type TEXT DEFAULT 'normal',
    country TEXT DEFAULT 'Global',
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
-- Recreate policies, but safe to ignore if already exists since we drop first
DROP POLICY IF EXISTS "Public News Access" ON public.news;
CREATE POLICY "Public News Access" ON public.news FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service Role News Upsert" ON public.news;
CREATE POLICY "Service Role News Upsert" ON public.news USING (true) WITH CHECK (true);

-- Fix public.matches
-- First ensure matches exists with basic structure if not present
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_a TEXT,
    team_b TEXT,
    score_a INTEGER,
    score_b INTEGER,
    status TEXT,
    start_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    stadium TEXT
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'matches' 
                   AND column_name = 'stadium') THEN
        ALTER TABLE public.matches ADD COLUMN stadium TEXT;
    END IF;
END $$;

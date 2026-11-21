-- Fix gov_services table columns
ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.gov_services ADD COLUMN IF NOT EXISTS source TEXT;
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

-- Set a unique constraint on URL if not present to allow for onConflict upserts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gov_services_url_key') THEN
        ALTER TABLE public.gov_services ADD CONSTRAINT gov_services_url_key UNIQUE (url);
    END IF;
END $$;

-- Ensure RLS is configured
ALTER TABLE public.gov_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public gov_services are viewable by everyone" ON public.gov_services;
CREATE POLICY "Public gov_services are viewable by everyone" ON public.gov_services FOR SELECT USING (true);

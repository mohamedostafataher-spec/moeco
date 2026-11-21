-- ULTIMATE REPAIR: FIX PERMISSIONS, SCHEMA, AND ACTIVATE ALL SOURCES
-- Run this in Supabase SQL Editor to solve the "Sources Not Appearing" problem

-- 1. SCHEMA REPAIR (Essential Columns)
ALTER TABLE public.rss_sources ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.rss_sources ADD COLUMN IF NOT EXISTS target_screen TEXT DEFAULT 'emergency';
ALTER TABLE public.rss_sources ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.rss_sources ADD COLUMN IF NOT EXISTS url TEXT; -- Some old scripts used 'url' instead of 'feed_url'
ALTER TABLE public.rss_sources ADD COLUMN IF NOT EXISTS feed_url TEXT;

-- 2. DATA SYNCHRONIZATION (Ensure all existing sources are visible)
UPDATE public.rss_sources SET 
  is_active = true, 
  target_screen = 'emergency' 
WHERE target_screen IS NULL OR target_screen = 'eco_news' OR is_active IS NULL;

-- 3. PERMISSION FIX (CRITICAL: Allows the App to read your sources)
-- Enable RLS if it's not enabled
ALTER TABLE public.rss_sources ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist to start fresh
DROP POLICY IF EXISTS "Allow public read" ON public.rss_sources;
DROP POLICY IF EXISTS "Public can read active sources" ON public.rss_sources;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rss_sources;

-- Create the SUPER-POLICY that allows everyone to read the sources
CREATE POLICY "Public Read Access" 
ON public.rss_sources 
FOR SELECT 
USING (true);

-- 4. NEWS TABLE PERMISSIONS (So you see the actual news/alerts)
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read news" ON public.news;
CREATE POLICY "Public Read News" 
ON public.news 
FOR SELECT 
USING (true);

-- 5. RE-INSERTING THE MASTER ARABIC SOURCES (In case they were deleted or broken)
INSERT INTO public.rss_sources (name, feed_url, target_screen, category, is_active) VALUES
('هيئة الأرصاد المصرية', 'https://www.youm7.com/rss/356', 'emergency', 'weather', true),
('الجزيرة - عاجل', 'https://www.aljazeera.net/rss', 'emergency', 'emergency', true),
('سكاي نيوز - عاجل', 'https://www.skynewsarabia.com/feeds/rss/urgent.xml', 'emergency', 'emergency', true),
('اليوم السابع - حوادث', 'https://www.youm7.com/rss/203', 'emergency', 'security', true),
('العربية - أخبار عاجلة', 'https://www.alarabiya.net/.mrss/ar/urgent.xml', 'emergency', 'emergency', true),
('BBC Arabic', 'https://feeds.bbci.co.uk/arabic/rss.xml', 'emergency', 'general', true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- Success Signal
SELECT '✅ SUCCESS: Permissions fixed and all sources activated!' as status;

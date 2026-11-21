-- FINAL REPAIR FOR ALERTS AND RSS SOURCES (APRIL 2026)
-- Run this in your Supabase SQL Editor

-- 1. FIX SCHEMA
ALTER TABLE public.rss_sources ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.rss_sources ADD COLUMN IF NOT EXISTS target_screen TEXT DEFAULT 'eco_news';
ALTER TABLE public.rss_sources ADD COLUMN IF NOT EXISTS priority_keywords TEXT[];
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS is_alert BOOLEAN DEFAULT false;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS alert_type TEXT DEFAULT 'normal';
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS target_screen TEXT DEFAULT 'eco_news';

-- 2. CLEANUP OLD BROKEN SOURCES (OPTIONAL)
-- DELETE FROM public.rss_sources WHERE is_active = false;

-- 3. INSERT HIGHLY RELIABLE ARABIC SOURCES
INSERT INTO public.rss_sources (name, feed_url, target_screen, category, is_active, priority_keywords) VALUES
('هيئة الأرصاد الجوية - مصر', 'https://www.youm7.com/rss/356', 'emergency', 'weather', true, ARRAY['حرارة', 'أمطار', 'رياح', 'شبورة', 'طقس']),
('الجزيرة - أخبار عاجلة', 'https://www.aljazeera.net/rss', 'emergency', 'alerts', true, ARRAY['عاجل', 'انفجار', 'قصف', 'طوارئ', 'حريق']),
('سكاي نيوز عربية - عاجل', 'https://www.skynewsarabia.com/feeds/rss/urgent.xml', 'emergency', 'alerts', true, ARRAY['عاجل', 'urgent', 'breaking']),
('اليوم السابع - حوادث', 'https://www.youm7.com/rss/203', 'emergency', 'alerts', true, ARRAY['حادث', 'تصادم', 'حريق', 'انهيار']),
('بي بي سي عربي - أخبار العالم', 'https://feeds.bbci.co.uk/arabic/rss.xml', 'eco_news', 'general', true, NULL),
('العربية - اقتصاد', 'https://www.alarabiya.net/aswaq/rss', 'eco_news', 'economy', true, NULL),
('منظمة الصحة العالمية - أخبار', 'https://www.who.int/rss-feeds/news-english.xml', 'emergency', 'health', true, ARRAY['outbreak', 'virus', 'pandemic', 'صحة', 'وباء']),
('Global Disaster Alert (GDACS)', 'https://www.gdacs.org/xml/rss.xml', 'emergency', 'alerts', true, ARRAY['earthquake', 'flood', 'tsunami', 'disaster', 'زلزال', 'فيضان'])
ON CONFLICT (feed_url) DO UPDATE SET 
  is_active = true,
  target_screen = EXCLUDED.target_screen,
  category = EXCLUDED.category,
  priority_keywords = EXCLUDED.priority_keywords;

-- 4. ENSURE UNIQUE CONSTRAINT ON URL FOR NEWS (PREVENTS DUPLICATES)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'news_url_key') THEN
        ALTER TABLE public.news ADD CONSTRAINT news_url_key UNIQUE (url);
    END IF;
END $$;

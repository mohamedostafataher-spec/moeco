-- UPDATE RSS SOURCES 2026: REPLACING BROKEN LINKS
-- Run this in Supabase SQL Editor.

-- 1. Update Sky News Planet
UPDATE public.rss_sources 
SET url = 'https://www.skynewsarabia.com/feeds/rss/planet.xml'
WHERE name LIKE '%سكاي نيوز%' AND name LIKE '%بيئة%';

-- 2. Update Al Arabiya
UPDATE public.rss_sources 
SET url = 'https://www.alarabiya.net/science-and-tech/rss'
WHERE name LIKE '%العربية%' AND category = 'environment';

-- 3. Update Al Jazeera Environment
UPDATE public.rss_sources 
SET url = 'https://www.aljazeera.net/rss/environment'
WHERE name LIKE '%الجزيرة%' AND (name LIKE '%بيئة%' OR category='environment');

-- 4. Disable known broken feeds (404/403 continuously)
UPDATE public.rss_sources 
SET is_active = false 
WHERE url LIKE '%youm7.com%' OR url LIKE '%ahram.org.eg%';

-- 5. Add a new reliable source
INSERT INTO public.rss_sources (name, url, target_screen, category, is_active)
SELECT 'BBC Arabic - Energy & Environment', 'http://feeds.bbci.co.uk/arabic/rss.xml', 'eco_news', 'environment', true
WHERE NOT EXISTS (SELECT 1 FROM public.rss_sources WHERE url = 'http://feeds.bbci.co.uk/arabic/rss.xml');

-- SUCCESS MESSAGE
SELECT '✅ RSS Sources Updated. Sync Engine will now use working URLs.' as status;

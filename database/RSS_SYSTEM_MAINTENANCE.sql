-- 1. التأكد من وجود الجدول
CREATE TABLE IF NOT EXISTS rss_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  target_screen TEXT DEFAULT 'eco_news',
  category TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. تنظيف البيانات المكررة (الحفاظ على الأحدث وحذف القديم عند تكرار الرابط)
DELETE FROM rss_sources
WHERE id NOT IN (
    SELECT MAX(id)
    FROM rss_sources
    GROUP BY url
);

-- 3. إدراج أو تحديث المصادر المطلوبة
INSERT INTO rss_sources (name, url, target_screen, category, is_active)
VALUES
  ('رئاسة الجمهورية', 'https://www.presidency.eg/rss', 'eco_news', 'politics', true),
  ('العربية - أخبار', 'https://www.alarabiya.net/feed/rss2/ar.xml', 'eco_news', 'all', true),
  ('الحدث - مصر', 'https://www.alhadath.net/.mrss/alhadath/egypt.xml', 'eco_news', 'politics', true),
  ('مصراوي - مصر', 'https://www.masrawy.com/rss/feed/35/%D9%85%D8%B5%D8%B1', 'eco_news', 'all', true),
  ('مصراوي - حوادث', 'https://www.masrawy.com/rss/feed/205/%D8%AD%D9%88%D8%A7%D8%AF%D8%AB', 'emergency', 'alerts', true),
  ('الشرق الأوسط', 'https://aawsat.com/feed', 'eco_news', 'all', true),
  ('Egypt Eco Secrets', 'https://media.rss.com/egypt-s-eco-secrets/feed.xml', 'eco_news', 'environment', true),
  ('المصري اليوم', 'https://www.almasryalyoum.com/rss/rssfeed', 'eco_news', 'all', true),
  ('FilGoal', 'https://www.filgoal.com/home/rss', 'eco_news', 'sports', true),
  ('صدى البلد', 'https://www.elbalad.news/Rss/Rss', 'eco_news', 'all', true),
  ('Egypt Today - Env', 'https://www.egypt-today.com/environment/rss.xml', 'eco_news', 'environment', true),
  ('بطولات', 'https://mobile.btolat.com/rss/newsfeed', 'eco_news', 'sports', true),
  ('BBC Arabic', 'http://feeds.bbci.co.uk/arabic/world/rss.xml', 'eco_news', 'all', true),
  ('BBC Arabic - Sports', 'http://feeds.bbci.co.uk/arabic/sports/index.xml', 'eco_news', 'sports', true)
ON CONFLICT (url) DO UPDATE 
SET name = EXCLUDED.name, 
    target_screen = EXCLUDED.target_screen, 
    category = EXCLUDED.category, 
    is_active = EXCLUDED.is_active;

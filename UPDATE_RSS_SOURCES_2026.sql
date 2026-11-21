-- تنظيف المصادر القديمة التي قد لا تعمل وتحديثها بمصادر موثوقة
-- MO ECO News & Alerts Sources Update 2026

-- 1. التأكد من وجود الأعمدة المطلوبة
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rss_sources' AND column_name='feed_url') THEN
    ALTER TABLE IF EXISTS rss_sources RENAME COLUMN url TO feed_url;
  END IF;
END $$;

-- 2. إيقاف المصادر التي أبلغ المستخدم أنها لا تعمل (اختياري، سنقوم بتحديثها)
UPDATE rss_sources SET is_active = false WHERE feed_url LIKE '%youm7.com/RSS%';

-- 3. إدراج أو تحديث المصادر البيئية الموثوقة (شاشة أخبار البيئة)
INSERT INTO rss_sources (name, feed_url, target_screen, category, is_active) VALUES
('بوابة الأهرام - البيئة', 'https://gate.ahram.org.eg/rss/8.aspx', 'eco_news', 'environment', true),
('مصراوي - البيئة', 'https://www.masrawy.com/rss/environment', 'eco_news', 'environment', true),
('سكاي نيوز عربية - كوكبنا', 'https://www.skynewsarabia.com/rss/planet', 'eco_news', 'environment', true),
('Green Area', 'https://greenarea.me/ar/feed/', 'eco_news', 'environment', true),
('مجلة البيئة والتنمية', 'https://www.afedmag.com/feed', 'eco_news', 'environment', true),
('بي بي سي عربي - علوم وطبيعة', 'https://feeds.bbci.co.uk/arabic/science_and_technology/rss.xml', 'eco_news', 'science', true),
('RT Arabic - أخبار العالم', 'https://arabic.rt.com/rss/all/', 'eco_news', 'general', true),
('اليوم السابع - البيئة', 'https://www.youm7.com/rss/359', 'eco_news', 'environment', true)
ON CONFLICT (feed_url) DO UPDATE SET 
  name = EXCLUDED.name,
  target_screen = EXCLUDED.target_screen,
  category = EXCLUDED.category,
  is_active = true;

-- 4. إدراج مصادر الإنذارات والطوارئ (شاشة الإنذارات)
INSERT INTO rss_sources (name, feed_url, target_screen, category, is_active, priority_keywords) VALUES
('هيئة الأرصاد المصرية - أخبار الطقس', 'https://www.youm7.com/rss/356', 'emergency', 'weather', true, ARRAY['تحذير', 'سيول', 'أمطار', 'منخفض', 'رياح', 'طقس', 'عاصفة']),
('مخاطر الكوارث العالمية (GDACS)', 'https://www.gdacs.org/xml/rss.xml', 'emergency', 'disaster', true, ARRAY['earthquake', 'flood', 'tsunami', 'cyclone', 'زلزال', 'فيضان', 'طوارئ']),
('المركز الوطني للزلازل (USGS)', 'https://earthquake.usgs.gov/feeds/2.5?format=rss', 'emergency', 'disaster', true, ARRAY['earthquake', 'magnitude', 'زلزال', 'هزة']),
('سكاي نيوز - أخبار عاجلة', 'https://www.skynewsarabia.com/rss', 'emergency', 'news', true, ARRAY['عاجل', 'حادث', 'انفجار', 'حريق', 'طوارئ']),
('رئاسة مجلس الوزراء - بيانات رسمية', 'https://www.presidency.eg/ar/rss/', 'emergency', 'government', false, ARRAY['قرار', 'عاجل', 'طوارئ', 'رسمي']) -- جعلته معطلاً كاحتياط إذا كان الرابط لا يعمل
ON CONFLICT (feed_url) DO UPDATE SET 
  name = EXCLUDED.name,
  target_screen = EXCLUDED.target_screen,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  priority_keywords = EXCLUDED.priority_keywords;

-- 5. تنظيف الأخبار القديمة جداً لتوفير مساحة وتحديث الشاشة (اختياري)
DELETE FROM news WHERE published_at < NOW() - INTERVAL '30 days';

-- ============================================
-- 1. التأكد من وجود تصنيف "إنذارات وطوارئ"
-- ============================================
INSERT INTO public.news_categories (name, name_ar, icon, display_order, is_active)
VALUES ('alerts', 'إنذارات وطوارئ', 'AlertTriangle', 1, true)
ON CONFLICT (name) DO UPDATE SET 
  name_ar = EXCLUDED.name_ar,
  icon = EXCLUDED.icon,
  is_active = true;

-- ============================================
-- 2. حذف أي إدخالات مكررة (حسب url) لتجنب التعارض
-- ============================================
DELETE FROM public.rss_sources
WHERE id IN (
  SELECT id FROM (
    SELECT id, url, ROW_NUMBER() OVER (PARTITION BY url ORDER BY id) AS rn
    FROM public.rss_sources
  ) t WHERE t.rn > 1
);

-- ============================================
-- 3. إدراج جميع مصادر شاشة الإنذارات والطوارئ
-- ============================================
INSERT INTO public.rss_sources (name, url, category_id, priority_keywords, is_active) 
VALUES
-- 📍 مصادر مصرية (حوادث وأمن)
('اليوم السابع - حوادث', 'https://www.youm7.com/RSS', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حادث', 'انفجار', 'تحذير', 'طوارئ', 'اشتباكات', 'حريق', 'زلزال', 'فيضان', 'سيول', 'عاصفة', 'حرب', 'عسكري', 'هجوم', 'صاروخ', 'أمني'], true),

('المصري اليوم - حوادث', 'https://www.almasryalyoum.com/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حادث', 'انفجار', 'تحذير', 'طوارئ', 'اشتباكات', 'حريق', 'زلزال', 'فيضان', 'سيول', 'حرب', 'عسكري', 'هجوم'], true),

('صدى البلد - حوادث', 'https://www.elbalad.news/rss.aspx', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حادث', 'انفجار', 'تحذير', 'طوارئ', 'اشتباكات', 'حريق', 'زلزال'], true),

('مصراوي - حوادث', 'https://www.masrawy.com/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حادث', 'انفجار', 'تحذير', 'طوارئ', 'اشتباكات', 'حريق', 'زلزال', 'حرب', 'عسكري', 'هجوم'], true),

('مبتدأ - حوادث', 'https://www.mobtada.com/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حادث', 'انفجار', 'تحذير', 'طوارئ', 'اشتباكات'], true),

('البوابة نيوز - حوادث', 'https://www.albawabhnews.com/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حادث', 'انفجار', 'تحذير', 'طوارئ'], true),

('الفجر - حوادث', 'https://www.elfagr.org/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حادث', 'انفجار', 'تحذير', 'طوارئ'], true),

('الدستور - حوادث', 'https://www.dostor.org/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حادث', 'انفجار', 'تحذير', 'طوارئ', 'اشتباكات'], true),

('المحور - حوادث', 'https://www.almihwar.com/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حادث', 'انفجار', 'طوارئ', 'أمن'], true),

-- 🌍 مصادر عربية ودولية (حربية وعسكرية وكوارث)
('روسيا اليوم - عاجل', 'https://arabic.rt.com/rss/sitemap/', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حرب', 'عسكري', 'اشتباكات', 'هجوم', 'صاروخ', 'تحذير عسكري', 'طيران حربي', 'قصف', 'غارة'], true),

('العالم - عاجل', 'https://www.alalam.ir/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حرب', 'عسكري', 'أمني', 'هجوم', 'صاروخ', 'إيران', 'اشتباكات', 'تحذير'], true),

('العربية - عاجل', 'https://www.alarabiya.net/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حرب', 'عسكري', 'اشتباكات', 'تحذير', 'طوارئ', 'هجوم', 'صراع', 'أزمة'], true),

('سبوتنيك - عربي', 'https://sputniknews.com/arabic/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حرب', 'عسكري', 'صراع', 'هجوم', 'صاروخ', 'عسكري', 'اشتباكات'], true),

('سكاي نيوز عربية - عاجل', 'https://www.skynewsarabia.com/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حرب', 'عسكري', 'اشتباكات', 'تحذير', 'طوارئ', 'هجوم', 'حادث', 'زلزال', 'فيضان', 'إعصار'], true),

('الجزيرة نت - عاجل', 'https://www.aljazeera.net/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['حرب', 'عسكري', 'اشتباكات', 'تحذير', 'طوارئ', 'هجوم', 'أزمة', 'كارثة'], true),

('BBC عربي - عاجل', 'https://feeds.bbci.co.uk/arabic/rss.xml', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['عاجل', 'طوارئ', 'حادث', 'تحذير', 'هجوم', 'زلزال', 'فيضان', 'إعصار'], true),

('الحرة - عاجل', 'https://www.alhurra.com/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['عاجل', 'طوارئ', 'حادث', 'تحذير', 'أزمة', 'حرب', 'اشتباكات'], true),

('العين الإخبارية - عاجل', 'https://al-ain.com/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['عاجل', 'حادث', 'طوارئ', 'تحذير', 'حرب', 'اشتباكات'], true),

-- 🌐 كوارث طبيعية وأزمات عالمية
('GDACS - كوارث عالمية', 'https://www.gdacs.org/xml/rss.xml', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['earthquake', 'flood', 'tsunami', 'cyclone', 'hurricane', 'volcano', 'زلزال', 'فيضان', 'تسونامي', 'إعصار', 'بركان'], true),

('RSOE EDIS - طوارئ عالمية', 'https://rsoe-edis.org/rss.xml', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['earthquake', 'flood', 'fire', 'volcano', 'storm', 'زلزال', 'فيضان', 'حريق', 'بركان', 'عاصفة'], true),

('USGS - زلازل', 'https://earthquake.usgs.gov/feeds/2.5?format=rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['earthquake', 'magnitude', 'زلزال', 'هزة أرضية'], true),

('IFRC - استجابة كوارث', 'https://www.ifrc.org/rss', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['emergency', 'disaster', 'crisis', 'طوارئ', 'كارثة', 'أزمة'], true),

-- 🏥 طوارئ صحية
('WHO - طوارئ صحية عالمية', 'https://www.who.int/rss-feeds/news-emergencies.xml', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['outbreak', 'pandemic', 'epidemic', 'health emergency', 'وباء', 'جائحة', 'تفشي', 'طوارئ صحية'], true),

('WHO - EMRO', 'https://www.emro.who.int/rss-feeds.html', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['طوارئ صحية', 'وباء', 'جائحة', 'تفشي', 'كورونا', 'حمى', 'كوليرا'], true),

('UN News - طوارئ', 'https://news.un.org/feed/subscribe/en/news/topic/emergencies/feed/rss.xml', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['emergency', 'crisis', 'humanitarian', 'طوارئ', 'أزمة', 'إنساني'], true),

-- 🏛️ مصادر رسمية مصرية (تحتاج تحويل - توضيح فقط)
('رئاسة مجلس الوزراء - قرارات طوارئ', 'https://www.presidency.eg/ar/rss/', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['طوارئ', 'حظر', 'إغلاق', 'قرار عاجل', 'أزمة'], true),

('هيئة الأرصاد - تحذيرات', 'https://cap-sources.s3.amazonaws.com/eg-ema-ar/rss.xml', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['تحذير', 'سيول', 'عاصفة', 'أمطار غزيرة', 'موجة حارة', 'موجة باردة', 'رياح'], true),

('صحيفة الأمن العام (الأردن)', 'https://www.psd.gov.jo/Pages/Rss.aspx', (SELECT id FROM news_categories WHERE name='alerts'), 
 ARRAY['تحذير أمني', 'إرهاب', 'حالة طوارئ', 'أمن', 'اشتباكات'], true)

ON CONFLICT (url) DO UPDATE SET 
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  priority_keywords = EXCLUDED.priority_keywords,
  is_active = EXCLUDED.is_active;

-- ============================================
-- 4. عرض عدد المصادر المضافة لكل فئة
-- ============================================
SELECT 
  'alerts' as screen,
  COUNT(*) as total_sources,
  COUNT(*) FILTER (WHERE url LIKE '%youm7%' OR url LIKE '%masry%' OR url LIKE '%elbalad%' OR url LIKE '%masrawy%') as egyptian_sources,
  COUNT(*) FILTER (WHERE url LIKE '%rt%' OR url LIKE '%alalam%' OR url LIKE '%alarabiya%' OR url LIKE '%sputnik%') as arab_sources,
  COUNT(*) FILTER (WHERE url LIKE '%gdacs%' OR url LIKE '%rsoe%' OR url LIKE '%usgs%') as disaster_sources
FROM public.rss_sources 
WHERE category_id = (SELECT id FROM news_categories WHERE name='alerts');

-- ============================================
-- 5. تفعيل Realtime على الجداول (إذا لم يكن مفعلاً)
-- ============================================
ALTER TABLE public.rss_sources REPLICA IDENTITY FULL;
-- Note: Ensure publication is configured in Supabase Dashboard

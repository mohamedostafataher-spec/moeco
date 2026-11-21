
-- إضافة المصادر الجديدة لشاشة الإنذارات
INSERT INTO public.rss_sources (name, url, target_screen, priority_keywords) VALUES
('رئاسة الجمهورية - أخبار', 'https://www.presidency.eg/ar/rss/', 'emergency', ARRAY['قرار', 'توجيه', 'طوارئ', 'إعلان']),
('صدى البلد', 'https://www.elbalad.news/rss.aspx', 'emergency', ARRAY['حادث', 'انفجار', 'تحذير', 'طوارئ', 'مصرع', 'إصابة']),
('بوابة الفجر', 'https://www.elfagr.org/rss.aspx', 'emergency', ARRAY['حادث', 'انفجار', 'طوارئ', 'مصرع']),
('الدستور', 'https://www.dostor.org/rss.aspx', 'emergency', ARRAY['حادث', 'انفجار', 'تحذير', 'طوارئ']),
('القاهرة 24', 'https://www.cairo24.com/rss.aspx', 'emergency', ARRAY['حادث', 'انفجار', 'طوارئ', 'مصرع']),
('قناة العالم - عاجل', 'https://www.alalam.ir/rss', 'emergency', ARRAY['عاجل', 'حرب', 'اشتباكات', 'صاروخ', 'قصف', 'تحذير', 'مقتل']),
('مصر تايمز', 'https://egypttime.com/feed', 'emergency', ARRAY['حادث', 'طوارئ', 'تحذير', 'انفجار']),
('اليوم السابع - حوادث', 'https://m.youm7.com/rss/SectionRss?SectionID=319', 'emergency', ARRAY['حادث', 'مصرع', 'إصابة', 'حريق', 'انفجار'])
ON CONFLICT (url) DO NOTHING;

-- إضافة المصادر الجديدة لشاشة أخبار البيئة
INSERT INTO public.rss_sources (name, url, target_screen) VALUES
('Egypt Oil & Gas', 'https://egyptoil-gas.com/news/feed', 'eco_news'),
('Daily News Egypt', 'https://dailynewsegypt.com/feed', 'eco_news'),
('Egypt Independent', 'https://egyptindependent.com/feed', 'eco_news'),
('Egyptian Streets', 'https://egyptianstreets.com/feed', 'eco_news'),
('مصر 5', 'https://misr5.com/feed', 'eco_news'),
('Mada Masr', 'https://madamasr.com/en/feed', 'eco_news'),
('Egypt Today', 'https://egypttoday.com/feed', 'eco_news'),
('نقوم مصرية', 'https://ngmisr.com/en/feed', 'eco_news'),
('Masrawy - Egypt', 'https://www.masrawy.com/rss/feed/35/%D9%85%D8%B5%D8%B1', 'eco_news'),
('Masrawy - News', 'https://www.masrawy.com/rss/feed/25/%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1', 'eco_news'),
('Almasryalyoum - Sect149', 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=149', 'eco_news'),
('Almasryalyoum - Sect150', 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=150', 'eco_news'),
('Almasryalyoum - Sect164', 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=164', 'eco_news'),
('Almasryalyoum - Sect7', 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=7', 'eco_news'),
('Almasryalyoum - Home', 'https://www.almasryalyoum.com/rss/rssfeed?homePage=true', 'eco_news'),
('Almasryalyoum - RSS', 'https://www.almasryalyoum.com/rss/rssfeed', 'eco_news'),
('Elsyasi - Egypt', 'https://www.elsyasi.com/rss/%D8%A7%D8%AE%D8%A8%D8%A7%D8%B1-%D9%85%D8%B5%D8%B1', 'eco_news'),
('Youm7 - Alerts', 'https://m.youm7.com/rss/SectionRss?SectionID=203', 'emergency'),
('Egypt Eco Secrets', 'https://media.rss.com/egypt-s-eco-secrets/feed.xml', 'eco_news'),
('Arab Finance - Cat9', 'https://www.arabfinance.com/ar/rss/rssbycat/9', 'eco_news'),
('Arab Finance - Cat7', 'https://www.arabfinance.com/ar/rss/rssbycat/7', 'eco_news'),
('Arab Finance - Cat4', 'https://www.arabfinance.com/ar/rss/rssbycat/4', 'eco_news'),
('Masrawy - Accidents', 'https://www.masrawy.com/rss/feed/205/%D8%AD%D9%88%D8%A7%D8%AF%D8%AB', 'emergency')
ON CONFLICT (url) DO NOTHING;

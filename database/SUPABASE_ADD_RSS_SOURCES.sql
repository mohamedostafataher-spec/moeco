-- جدول مصادر RSS (ديناميكي)
CREATE TABLE IF NOT EXISTS rss_sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  target_screen TEXT NOT NULL, -- 'eco_news' أو 'emergency'
  category TEXT, -- للتصنيف الداخلي (مثل 'weather', 'security', 'health')
  is_active BOOLEAN DEFAULT true,
  needs_conversion BOOLEAN DEFAULT false, -- false = RSS جاهز
  priority_keywords TEXT[], -- كلمات مفتاحية لتحديد الأولوية (للإنذارات)
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول الأخبار الموحد (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  url TEXT UNIQUE NOT NULL,
  image_url TEXT,
  published_at TIMESTAMP,
  category TEXT,
  target_screen TEXT, -- 'eco_news', 'emergency', 'general'
  priority TEXT DEFAULT 'normal', -- 'urgent', 'important', 'normal'
  is_estimated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- تفعيل Realtime على كلا الجدولين
ALTER TABLE rss_sources REPLICA IDENTITY FULL;
ALTER TABLE news REPLICA IDENTITY FULL;

-- إدراج مصادر شاشة أخبار البيئة (eco_news)
INSERT INTO rss_sources (name, feed_url, target_screen, category) VALUES
('Egypt Independent – Environment', 'https://www.egyptindependent.com/category/environment/feed/', 'eco_news', 'environment'),
('Daily News Egypt – Environment', 'https://www.dailynewsegypt.com/category/environment/feed/', 'eco_news', 'environment'),
('Egyptian Streets – Environment', 'https://egyptianstreets.com/category/environment/feed/', 'eco_news', 'environment'),
('مصراوي', 'https://www.masrawy.com/rss', 'eco_news', 'general'),
('اليوم السابع', 'https://www.youm7.com/RSS', 'eco_news', 'general'),
('المصري اليوم', 'https://www.almasryalyoum.com/rss', 'eco_news', 'general'),
('سكاي نيوز عربية – البيئة', 'https://www.skynewsarabia.com/rss/environment.xml', 'eco_news', 'environment'),
('UN Environment Programme', 'https://www.unep.org/news-and-stories/rss.xml', 'eco_news', 'climate'),
('NASA Climate Change', 'https://climate.nasa.gov/news/rss.xml', 'eco_news', 'climate'),
('BBC Science & Environment', 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml', 'eco_news', 'science'),
('Environmental News Network', 'https://www.enn.com/rss', 'eco_news', 'general'),
('مجلة البيئة والتنمية', 'https://www.afedmag.com/feed', 'eco_news', 'arabic')
ON CONFLICT (feed_url) DO NOTHING;

-- إدراج مصادر شاشة الإنذارات والطوارئ (emergency) مع كلمات مفتاحية للأولوية
INSERT INTO rss_sources (name, feed_url, target_screen, category, priority_keywords) VALUES
('رئاسة مجلس الوزراء المصري', 'https://www.presidency.eg/ar/rss/', 'emergency', 'government', ARRAY['طوارئ', 'حظر', 'إغلاق', 'قرار عاجل']),
('هيئة الأرصاد – عربي', 'https://cap-sources.s3.amazonaws.com/eg-ema-ar/rss.xml', 'emergency', 'weather', ARRAY['تحذير', 'سيول', 'عاصفة', 'أمطار غزيرة', 'موجة حارة']),
('هيئة الأرصاد – إنجليزي', 'https://cap-sources.s3.amazonaws.com/eg-ema-en/rss.xml', 'emergency', 'weather', ARRAY['warning', 'flood', 'storm', 'heatwave']),
('اليوم السابع – أخبار عاجلة', 'https://www.youm7.com/RSS', 'emergency', 'news', ARRAY['حادث', 'انفجار', 'إطلاق نار', 'اشتباكات', 'حريق']),
('المصري اليوم – أخبار عاجلة', 'https://www.almasryalyoum.com/rss', 'emergency', 'news', ARRAY['حادث', 'انفجار', 'إطلاق نار', 'اشتباكات']),
('صدى البلد', 'https://www.elbalad.news/rss.aspx', 'emergency', 'news', ARRAY['حادث', 'انفجار', 'اشتباكات']),
('أخبار اليوم', 'https://akhbaralyom.net/rss.php', 'emergency', 'news', ARRAY['حادث', 'أزمة', 'طوارئ']),
('سكاي نيوز عربية', 'https://www.skynewsarabia.com/rss', 'emergency', 'news', ARRAY['عاجل', 'كارثة', 'حريق', 'أزمة']),
('الجزيرة نت', 'https://www.aljazeera.net/rss', 'emergency', 'news', ARRAY['عاجل', 'كارثة', 'اشتباك']),
('بي بي سي عربي', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'emergency', 'news', ARRAY['عاجل', 'كارثة', 'طوارئ']),
('العربية', 'https://www.alarabiya.net/rss', 'emergency', 'news', ARRAY['عاجل', 'كارثة', 'اشتباك']),
('GDACS', 'https://www.gdacs.org/xml/rss.xml', 'emergency', 'disaster', ARRAY['earthquake', 'flood', 'tsunami', 'cyclone', 'زلزال', 'فيضان']),
('RSOE EDIS', 'https://rsoe-edis.org/rss.xml', 'emergency', 'disaster', ARRAY['earthquake', 'flood', 'fire', 'volcano']),
('USGS Earthquakes', 'https://earthquake.usgs.gov/feeds/2.5?format=rss', 'emergency', 'earthquake', ARRAY['earthquake', 'magnitude', 'زلزال']),
('IFRC', 'https://www.ifrc.org/rss', 'emergency', 'humanitarian', ARRAY['emergency', 'disaster', 'crisis']),
('WHO – Emergencies', 'https://www.who.int/rss-feeds/news-emergencies.xml', 'emergency', 'health', ARRAY['outbreak', 'pandemic', 'epidemic', 'وباء']),
('UN News – Emergencies', 'https://news.un.org/feed/subscribe/en/news/topic/emergencies/feed/rss.xml', 'emergency', 'humanitarian', ARRAY['emergency', 'crisis', 'humanitarian']),
('الأمم المتحدة – أخبار الطوارئ', 'https://news.un.org/feed/subscribe/ar/news/topic/emergencies/feed/rss.xml', 'emergency', 'humanitarian', ARRAY['طوارئ', 'أزمة', 'إنسانية', 'وباء'])
ON CONFLICT (feed_url) DO NOTHING;

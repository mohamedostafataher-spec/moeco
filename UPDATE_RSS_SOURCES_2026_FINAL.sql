-- UPDATE_RSS_SOURCES_2026_FINAL.sql

-- Ensure table exists with necessary columns
CREATE TABLE IF NOT EXISTS rss_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    feed_url TEXT,
    category TEXT DEFAULT 'general',
    target_screen TEXT DEFAULT 'eco_news',
    is_active BOOLEAN DEFAULT true,
    last_fetched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert/Update sources
INSERT INTO rss_sources (name, url, category, target_screen, is_active) VALUES
('مصراوي - مصر', 'https://www.masrawy.com/rss/feed/35/%D9%85%D8%B5%D8%B1', 'politics', 'emergency', true),
('مصراوي - أخبار', 'https://www.masrawy.com/rss/feed/25/%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1', 'general', 'eco_news', true),
('المصري اليوم - أخبار', 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=149', 'general', 'eco_news', true),
('المصري اليوم - 150', 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=150', 'general', 'eco_news', true),
('المصري اليوم - 164', 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=164', 'general', 'eco_news', true),
('المصري اليوم - 7', 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=7', 'general', 'eco_news', true),
('المصري اليوم - الرئيسية', 'https://www.almasryalyoum.com/rss/rssfeed?homePage=true', 'general', 'eco_news', true),
('المصري اليوم - عام', 'https://www.almasryalyoum.com/rss/rssfeed', 'general', 'eco_news', true),
('السياسي - أخبار مصر', 'https://www.elsyasi.com/rss/%D8%A7%D8%AE%D8%A8%D8%A7%D8%B1-%D9%85%D8%B5%D8%B1', 'politics', 'eco_news', true),
('اليوم السابع - 319', 'https://m.youm7.com/rss/SectionRss?SectionID=319', 'general', 'eco_news', true),
('اليوم السابع - 203', 'https://m.youm7.com/rss/SectionRss?SectionID=203', 'general', 'eco_news', true),
('أسرار البيئة في مصر', 'https://media.rss.com/egypt-s-eco-secrets/feed.xml', 'environment', 'eco_news', true),
('عرب فاينانس - استثمار', 'https://www.arabfinance.com/ar/rss/rssbycat/9', 'economy', 'eco_news', true),
('عرب فاينانس - أخبار', 'https://www.arabfinance.com/ar/rss/rssbycat/7', 'economy', 'eco_news', true),
('عرب فاينانس - بنوك', 'https://www.arabfinance.com/ar/rss/rssbycat/4', 'economy', 'eco_news', true),
('مصراوي - حوادث', 'https://www.masrawy.com/rss/feed/205/%D8%AD%D9%88%D8%A7%D8%AF%D8%AB', 'accidents', 'emergency', true)
ON CONFLICT (url) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    target_screen = EXCLUDED.target_screen,
    is_active = EXCLUDED.is_active;

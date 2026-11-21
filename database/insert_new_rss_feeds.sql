
INSERT INTO rss_sources (name, url, category, is_active) VALUES
('Masrawy - مصر', 'https://www.masrawy.com/rss/feed/35/مصر', 'politics', true),
('Masrawy - أخبار', 'https://www.masrawy.com/rss/feed/25/أخبار', 'general', true),
('Masrawy - حوادث', 'https://www.masrawy.com/rss/feed/205/حوادث', 'accidents', true),
('Al Masry Al Youm - 1', 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=149', 'general', true),
('Al Masry Al Youm - 2', 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=150', 'general', true),
('Al Masry Al Youm - 3', 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=164', 'general', true),
('Al Masry Al Youm - 4', 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=7', 'general', true),
('Al Masry Al Youm - 5', 'https://www.almasryalyoum.com/rss/rssfeed?homePage=true', 'general', true),
('Al Masry Al Youm - 6', 'https://www.almasryalyoum.com/rss/rssfeed', 'general', true),
('Youm7 - 1', 'https://m.youm7.com/rss/SectionRss?SectionID=319', 'general', true),
('Youm7 - 2', 'https://m.youm7.com/rss/SectionRss?SectionID=203', 'general', true),
('ArabFinance - 1', 'https://www.arabfinance.com/ar/rss/rssbycat/9', 'finance', true),
('ArabFinance - 2', 'https://www.arabfinance.com/ar/rss/rssbycat/7', 'finance', true),
('ArabFinance - 3', 'https://www.arabfinance.com/ar/rss/rssbycat/4', 'finance', true),
('Elsyasi', 'https://www.elsyasi.com/rss/اخبار-مصر', 'politics', true),
('Environment', 'https://media.rss.com/egypt-s-eco-secrets/feed.xml', 'environment', true)
ON CONFLICT (url) DO NOTHING;

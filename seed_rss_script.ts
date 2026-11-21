import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://awwbrmgzdqazhpsrznpq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

const newSources = [
  { name: 'رئاسة الجمهورية', url: 'https://www.presidency.eg/rss', target_screen: 'eco_news', category: 'politics', is_active: true },
  { name: 'العربية - أخبار', url: 'https://www.alarabiya.net/feed/rss2/ar.xml', target_screen: 'eco_news', category: 'all', is_active: true },
  { name: 'الحدث - مصر', url: 'https://www.alhadath.net/.mrss/alhadath/egypt.xml', target_screen: 'eco_news', category: 'politics', is_active: true },
  { name: 'مصراوي - مصر', url: 'https://www.masrawy.com/rss/feed/35/%D9%85%D8%B5%D8%B1', target_screen: 'eco_news', category: 'all', is_active: true },
  { name: 'مصراوي - حوادث', url: 'https://www.masrawy.com/rss/feed/205/%D8%AD%D9%88%D8%A7%D8%AF%D8%AB', target_screen: 'emergency', category: 'alerts', is_active: true },
  { name: 'الشرق الأوسط', url: 'https://aawsat.com/feed', target_screen: 'eco_news', category: 'all', is_active: true },
  { name: 'Egypt Eco Secrets', url: 'https://media.rss.com/egypt-s-eco-secrets/feed.xml', target_screen: 'eco_news', category: 'environment', is_active: true },
  { name: 'المصري اليوم', url: 'https://www.almasryalyoum.com/rss/rssfeed', target_screen: 'eco_news', category: 'all', is_active: true },
  { name: 'FilGoal', url: 'https://www.filgoal.com/home/rss', target_screen: 'eco_news', category: 'sports', is_active: true },
  { name: 'صدى البلد', url: 'https://www.elbalad.news/Rss/Rss', target_screen: 'eco_news', category: 'all', is_active: true },
  { name: 'Egypt Today - Env', url: 'https://www.egypt-today.com/environment/rss.xml', target_screen: 'eco_news', category: 'environment', is_active: true },
  { name: 'بطولات', url: 'https://mobile.btolat.com/rss/newsfeed', target_screen: 'eco_news', category: 'sports', is_active: true },
  { name: 'BBC Arabic', url: 'https://feeds.bbci.co.uk/arabic/world/rss.xml', target_screen: 'eco_news', category: 'all', is_active: true },
  { name: 'BBC Arabic - Sports', url: 'https://feeds.bbci.co.uk/arabic/sports/index.xml', target_screen: 'eco_news', category: 'sports', is_active: true }
];

async function seed() {
  console.log('Seeding RSS sources...');
  for (const source of newSources) {
    const { error } = await supabase.from('rss_sources').upsert(source, { onConflict: 'url' });
    if (error) console.error(`Error inserting ${source.name}:`, error);
    else console.log(`Inserted/Updated ${source.name}`);
  }
}

seed();

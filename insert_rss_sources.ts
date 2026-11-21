import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://eiboutdvbjoipdpeqrci.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYm91dGR2YmpvaXBkcGVxcmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMTcwMjUsImV4cCI6MjA1Njc5MzAyNX0.VwXh_n3v2Q9K-F33c7r2qM_54Q63V2QoN_pGq8mB3H8';
if (supabaseUrl && typeof supabaseUrl === 'string') {
  if (supabaseUrl.endsWith('/')) supabaseUrl = supabaseUrl.slice(0, -1);
  if (supabaseUrl.includes('/rest/v1')) supabaseUrl = supabaseUrl.split('/rest/v1')[0];
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const emergencySources = [
  { name: 'رئاسة الجمهورية - أخبار', url: 'https://www.presidency.eg/ar/rss/', target_screen: 'emergency', priority_keywords: ['قرار', 'توجيه', 'طوارئ', 'إعلان'] },
  { name: 'صدى البلد', url: 'https://www.elbalad.news/rss.aspx', target_screen: 'emergency', priority_keywords: ['حادث', 'انفجار', 'تحذير', 'طوارئ', 'مصرع', 'إصابة'] },
  { name: 'بوابة الفجر', url: 'https://www.elfagr.org/rss.aspx', target_screen: 'emergency', priority_keywords: ['حادث', 'انفجار', 'طوارئ', 'مصرع'] },
  { name: 'الدستور', url: 'https://www.dostor.org/rss.aspx', target_screen: 'emergency', priority_keywords: ['حادث', 'انفجار', 'تحذير', 'طوارئ'] },
  { name: 'القاهرة 24', url: 'https://www.cairo24.com/rss.aspx', target_screen: 'emergency', priority_keywords: ['حادث', 'انفجار', 'طوارئ', 'مصرع'] },
  { name: 'قناة العالم - عاجل', url: 'https://www.alalam.ir/rss', target_screen: 'emergency', priority_keywords: ['عاجل', 'حرب', 'اشتباكات', 'صاروخ', 'قصف', 'تحذير', 'مقتل'] },
  { name: 'Masrawy - Accidents', url: 'https://www.masrawy.com/rss/feed/205/%D8%AD%D9%88%D8%A7%D8%AF%D8%AB', target_screen: 'emergency', priority_keywords: ['حادث', 'طوارئ'] }
];

const ecoSources = [
  { name: 'Egypt Oil & Gas', url: 'https://egyptoil-gas.com/news/feed', target_screen: 'eco_news' },
  { name: 'Daily News Egypt', url: 'https://dailynewsegypt.com/feed', target_screen: 'eco_news' },
  { name: 'Egypt Independent', url: 'https://egyptindependent.com/feed', target_screen: 'eco_news' },
  { name: 'Egyptian Streets', url: 'https://egyptianstreets.com/feed', target_screen: 'eco_news' },
  { name: 'مصر 5', url: 'https://misr5.com/feed', target_screen: 'eco_news' },
  { name: 'Mada Masr', url: 'https://madamasr.com/en/feed', target_screen: 'eco_news' },
  { name: 'Egypt Today', url: 'https://egypttoday.com/feed', target_screen: 'eco_news' },
  { name: 'نقوم مصرية', url: 'https://ngmisr.com/en/feed', target_screen: 'eco_news' },
  { name: 'Masrawy - Egypt', url: 'https://www.masrawy.com/rss/feed/35/%D9%85%D8%B5%D8%B1', target_screen: 'eco_news' },
  { name: 'Masrawy - News', url: 'https://www.masrawy.com/rss/feed/25/%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1', target_screen: 'eco_news' },
  { name: 'Almasryalyoum - Sect149', url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=149', target_screen: 'eco_news' },
  { name: 'Almasryalyoum - Sect150', url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=150', target_screen: 'eco_news' },
  { name: 'Almasryalyoum - Sect164', url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=164', target_screen: 'eco_news' },
  { name: 'Almasryalyoum - Sect7', url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=7', target_screen: 'eco_news' },
  { name: 'Almasryalyoum - Home', url: 'https://www.almasryalyoum.com/rss/rssfeed?homePage=true', target_screen: 'eco_news' },
  { name: 'Almasryalyoum - RSS', url: 'https://www.almasryalyoum.com/rss/rssfeed', target_screen: 'eco_news' },
  { name: 'Elsyasi - Egypt', url: 'https://www.elsyasi.com/rss/%D8%A7%D8%AE%D8%A8%D8%A7%D8%B1-%D9%85%D8%B5%D8%B1', target_screen: 'eco_news' },
  { name: 'Egypt Eco Secrets', url: 'https://media.rss.com/egypt-s-eco-secrets/feed.xml', target_screen: 'eco_news' },
  { name: 'Arab Finance - Cat9', url: 'https://www.arabfinance.com/ar/rss/rssbycat/9', target_screen: 'eco_news' },
  { name: 'Arab Finance - Cat7', url: 'https://www.arabfinance.com/ar/rss/rssbycat/7', target_screen: 'eco_news' },
  { name: 'Arab Finance - Cat4', url: 'https://www.arabfinance.com/ar/rss/rssbycat/4', target_screen: 'eco_news' }
];

async function run() {
  console.log('Inserting EMERGENCY sources...');
  for(const src of emergencySources) {
      const { data, error } = await supabase.from('rss_sources').upsert({
          name: src.name,
          feed_url: src.url,
          target_screen: src.target_screen,
          priority_keywords: src.priority_keywords,
          is_active: true
      }, { onConflict: 'feed_url' });
      if(error) console.log('Error:', src.name, error.message);
  }
  
  console.log('Inserting ECO NEWS sources...');
  for(const src of ecoSources) {
      const { data, error } = await supabase.from('rss_sources').upsert({
          name: src.name,
          feed_url: src.url,
          target_screen: src.target_screen,
          is_active: true
      }, { onConflict: 'feed_url' });
      if(error) console.log('Error:', src.name, error.message);
  }
  console.log('Done.');
}
run();

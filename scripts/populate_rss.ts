import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://eiboutdvbjoipdpeqrci.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYm91dGR2YmpvaXBkcGVxcmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMTcwMjUsImV4cCI6MjA1Njc5MzAyNX0.VwXh_n3v2Q9K-F33c7r2qM_54Q63V2QoN_pGq8mB3H8';

if (supabaseUrl && typeof supabaseUrl === 'string') {
  if (supabaseUrl.endsWith('/')) supabaseUrl = supabaseUrl.slice(0, -1);
  if (supabaseUrl.includes('/rest/v1')) supabaseUrl = supabaseUrl.split('/rest/v1')[0];
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sources = [
  // MAIN NEWS
  { url: 'https://www.masrawy.com/rss/feed/35/%D9%85%D8%B5%D8%B1', target_screen: 'general', group: 'main' },
  { url: 'https://www.masrawy.com/rss/feed/25/%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1', target_screen: 'general', group: 'main' },
  { url: 'https://www.masrawy.com/rss/feed/205/%D8%AD%D9%88%D8%A7%D8%AF%D8%AB', target_screen: 'general', group: 'main' },
  { url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=149', target_screen: 'general', group: 'main' },
  { url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=150', target_screen: 'general', group: 'main' },
  { url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=164', target_screen: 'general', group: 'main' },
  { url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=7', target_screen: 'general', group: 'main' },
  { url: 'https://www.almasryalyoum.com/rss/rssfeed', target_screen: 'general', group: 'main' },
  { url: 'https://www.almasryalyoum.com/rss/rssfeed?homePage=true', target_screen: 'general', group: 'main' },
  { url: 'https://m.youm7.com/rss/SectionRss?SectionID=319', target_screen: 'general', group: 'main' },
  { url: 'https://m.youm7.com/rss/SectionRss?SectionID=203', target_screen: 'general', group: 'main' },
  { url: 'https://www.elsyasi.com/rss/%D8%A7%D8%AE%D8%A8%D8%A7%D8%B1-%D9%85%D8%B5%D8%B1', target_screen: 'general', group: 'main' },
  { url: 'https://www.arabfinance.com/ar/rss/rssbycat/9', target_screen: 'general', group: 'main' },
  { url: 'https://www.arabfinance.com/ar/rss/rssbycat/7', target_screen: 'general', group: 'main' },
  { url: 'https://www.arabfinance.com/ar/rss/rssbycat/4', target_screen: 'general', group: 'main' },

  // ENVIRONMENT
  { url: 'https://media.rss.com/egypt-s-eco-secrets/feed.xml', target_screen: 'eco_news', group: 'environment' },
  { url: 'https://egyptoil-gas.com/news/feed', target_screen: 'eco_news', group: 'environment' },
  { url: 'https://dailynewsegypt.com/feed', target_screen: 'eco_news', group: 'environment' },
  { url: 'https://egyptindependent.com/feed', target_screen: 'eco_news', group: 'environment' },
  { url: 'https://egyptianstreets.com/feed', target_screen: 'eco_news', group: 'environment' },
  { url: 'https://madamasr.com/en/feed', target_screen: 'eco_news', group: 'environment' },
  { url: 'https://egypttoday.com/feed', target_screen: 'eco_news', group: 'environment' },
  { url: 'https://ngmisr.com/en/feed', target_screen: 'eco_news', group: 'environment' },

  // EMERGENCY
  { url: 'https://www.presidency.eg/ar/rss/', target_screen: 'emergency', group: 'emergency' },
  { url: 'https://www.elbalad.news/rss.aspx', target_screen: 'emergency', group: 'emergency' },
  { url: 'https://www.elfagr.org/rss.aspx', target_screen: 'emergency', group: 'emergency' },
  { url: 'https://www.dostor.org/rss.aspx', target_screen: 'emergency', group: 'emergency' },
  { url: 'https://www.cairo24.com/rss.aspx', target_screen: 'emergency', group: 'emergency' },
  { url: 'https://www.alalam.ir/rss', target_screen: 'emergency', group: 'emergency' },
  { url: 'https://egypttime.com/feed', target_screen: 'emergency', group: 'emergency' }
];

async function run() {
  await supabase.from('rss_sources').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  for (const s of sources) {
      const { error } = await supabase.from('rss_sources').insert({
          feed_url: s.url,
          url: s.url,
          category: s.target_screen,
          is_active: true
      });
      if (error) {
         console.error('Failed to insert', s.url, error.message);
      } else {
         console.log('Inserted', s.url);
      }
  }
}
run();

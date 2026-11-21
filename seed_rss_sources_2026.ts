import dotenv from 'dotenv';
dotenv.config();

import { supabase } from './server/services/supabaseClient';

const newSources = [
  { name: 'مصراوي - مصر', url: 'https://www.masrawy.com/rss/feed/35/%D9%85%D8%B5%D8%B1', feed_url: 'https://www.masrawy.com/rss/feed/35/%D9%85%D8%B5%D8%B1', target_screen: 'emergency', category: 'politics', is_active: true },
  { name: 'مصراوي - أخبار', url: 'https://www.masrawy.com/rss/feed/25/%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1', feed_url: 'https://www.masrawy.com/rss/feed/25/%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1', target_screen: 'eco_news', category: 'general', is_active: true },
  { name: 'المصري اليوم - 149', url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=149', feed_url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=149', target_screen: 'eco_news', category: 'general', is_active: true },
  { name: 'المصري اليوم - 150', url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=150', feed_url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=150', target_screen: 'eco_news', category: 'general', is_active: true },
  { name: 'المصري اليوم - 164', url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=164', feed_url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=164', target_screen: 'eco_news', category: 'general', is_active: true },
  { name: 'المصري اليوم - 7', url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=7', feed_url: 'https://www.almasryalyoum.com/rss/rssfeed?sectionId=7', target_screen: 'eco_news', category: 'general', is_active: true },
  { name: 'المصري اليوم - رئيسية', url: 'https://www.almasryalyoum.com/rss/rssfeed?homePage=true', feed_url: 'https://www.almasryalyoum.com/rss/rssfeed?homePage=true', target_screen: 'eco_news', category: 'general', is_active: true },
  { name: 'المصري اليوم - عام', url: 'https://www.almasryalyoum.com/rss/rssfeed', feed_url: 'https://www.almasryalyoum.com/rss/rssfeed', target_screen: 'eco_news', category: 'general', is_active: true },
  { name: 'السياسي', url: 'https://www.elsyasi.com/rss/%D8%A7%D8%AE%D8%A8%D8%A7%D8%B1-%D9%85%D8%B5%D8%B1', feed_url: 'https://www.elsyasi.com/rss/%D8%A7%D8%AE%D8%A8%D8%A7%D8%B1-%D9%85%D8%B5%D8%B1', target_screen: 'eco_news', category: 'politics', is_active: true },
  { name: 'البيئة', url: 'https://media.rss.com/egypt-s-eco-secrets/feed.xml', feed_url: 'https://media.rss.com/egypt-s-eco-secrets/feed.xml', target_screen: 'eco_news', category: 'environment', is_active: true },
  { name: 'عرب فاينانس - 9', url: 'https://www.arabfinance.com/ar/rss/rssbycat/9', feed_url: 'https://www.arabfinance.com/ar/rss/rssbycat/9', target_screen: 'eco_news', category: 'economy', is_active: true },
  { name: 'عرب فاينانس - 7', url: 'https://www.arabfinance.com/ar/rss/rssbycat/7', feed_url: 'https://www.arabfinance.com/ar/rss/rssbycat/7', target_screen: 'eco_news', category: 'economy', is_active: true },
  { name: 'عرب فاينانس - 4', url: 'https://www.arabfinance.com/ar/rss/rssbycat/4', feed_url: 'https://www.arabfinance.com/ar/rss/rssbycat/4', target_screen: 'eco_news', category: 'economy', is_active: true },
  { name: 'مصراوي - حوادث', url: 'https://www.masrawy.com/rss/feed/205/%D8%AD%D9%88%D8%A7%D8%AF%D8%AB', feed_url: 'https://www.masrawy.com/rss/feed/205/%D8%AD%D9%88%D8%A7%D8%AF%D8%AB', target_screen: 'emergency', category: 'accidents', is_active: true }
];

async function seed() {
  console.log('Seeding RSS sources 2026...');
  for (const source of newSources) {
    // Try to just insert, if fails we catch it.
    const { error } = await supabase.from('rss_sources').upsert(source, { onConflict: 'feed_url' });
    if (error) {
        console.error(`Error inserting ${source.name}:`, error.message);
        // Fallback to simple insert if upsert fails
        const { error: insErr } = await supabase.from('rss_sources').insert(source);
        if (insErr) console.error(`Insert fallback failed for ${source.name}:`, insErr.message);
        else console.log(`Inserted ${source.name} using fallback`);
    } else {
        console.log(`Inserted/Updated ${source.name}`);
    }
  }
}

seed();

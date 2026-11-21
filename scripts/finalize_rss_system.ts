
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

const NEW_SOURCES = [
  { name: 'Youm7 Egypt News', feed_url: 'https://www.youm7.com/rss/SectionRss/65/1', target_screen: 'general', category: 'general', is_active: true },
  { name: 'Youm7 Economy', feed_url: 'https://www.youm7.com/rss/SectionRss/297/1', target_screen: 'general', category: 'economy', is_active: true },
  { name: 'Almasry Alyoum', feed_url: 'https://www.almasryalyoum.com/rss/rssfeeds', target_screen: 'general', category: 'general', is_active: true },
  { name: 'Ahram Online', feed_url: 'https://gate.ahram.org.eg/rss.aspx', target_screen: 'general', category: 'general', is_active: true },
  { name: 'Masrawy', feed_url: 'https://www.masrawy.com/rss', target_screen: 'general', category: 'general', is_active: true },
  { name: 'Dostor', feed_url: 'https://www.dostor.org/rss.aspx', target_screen: 'general', category: 'general', is_active: true },
  { name: 'Cairo24', feed_url: 'https://www.cairo24.com/rss', target_screen: 'general', category: 'general', is_active: true },
  { name: 'NASA Climate', feed_url: 'https://climate.nasa.gov/feeds/news-featured.xml', target_screen: 'eco_news', category: 'climate', is_active: true },
  { name: 'UNEP Environment', feed_url: 'https://www.unep.org/rss.xml', target_screen: 'eco_news', category: 'environment', is_active: true },
  { name: 'WHO Environmental Health', feed_url: 'https://www.who.int/feeds/entity/news-room/rss-feeds/environmental-health', target_screen: 'eco_news', category: 'health', is_active: true },
  { name: 'BBC Science & Environment', feed_url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', target_screen: 'eco_news', category: 'science', is_active: true }
];

const BROKEN_URLS = [
  'https://egypttime.com/feed',
  'https://m.youm7.com/rss/SectionRss?SectionID=319',
  'https://m.youm7.com/rss/SectionRss?SectionID=203'
];

async function finalizeRss() {
  console.log("🚀 Starting RSS System Finalization...");

  try {
    // 1. Deactivate broken feeds
    for (const url of BROKEN_URLS) {
      console.log(`Deactivating broken feed: ${url}`);
      await supabase.from('rss_sources').update({ is_active: false }).or(`feed_url.eq.${url},url.eq.${url}`);
    }

    // 2. Upsert new working feeds
    for (const source of NEW_SOURCES) {
      console.log(`Ensuring source: ${source.name} (${source.feed_url})`);
      
      // Try to find by feed_url or url
      const { data: existing } = await supabase
        .from('rss_sources')
        .select('id')
        .or(`feed_url.eq.${source.feed_url},url.eq.${source.feed_url}`)
        .maybeSingle();

      if (existing) {
        await supabase.from('rss_sources').update({
          ...source,
          is_active: true
        }).eq('id', existing.id);
      } else {
        await supabase.from('rss_sources').insert([source]);
      }
    }

    console.log("✅ RSS sources updated successfully.");
    
    // 3. Clear old news/alerts to make room for fresh synced data
    console.log("Cleaning up old news...");
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await supabase.from('news').delete().lt('published_at', thirtyDaysAgo.toISOString());
    
    console.log("🎉 RSS Audit & Repair Complete.");
  } catch (error: any) {
    console.error("FATAL ERROR during RSS completion:", error.message);
  }
}

finalizeRss();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deactivate() {
  const failingFeeds = [
    'https://www.alarabiya.net/science-and-tech/rss',
    'https://www.skynewsarabia.com/feeds/rss/planet.xml',
    'https://www.aljazeera.net/rss/environment'
  ];

  console.log('Deactivating failing feeds...');
  for (const url of failingFeeds) {
    const { data, error } = await supabase.from('rss_sources').update({ is_active: false }).eq('feed_url', url);
    if (error) {
        console.error(`Error deactivating ${url}:`, error.message);
    } else {
        console.log(`Deactivated ${url}`);
    }
  }
}
deactivate();

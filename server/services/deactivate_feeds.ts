import { supabase } from './supabaseClient.ts';

async function deactivate() {
  const failingFeeds = [
    'https://www.alarabiya.net/science-and-tech/rss',
    'https://www.skynewsarabia.com/feeds/rss/planet.xml',
    'https://www.aljazeera.net/rss/environment'
  ];

  console.log('Deactivating failing feeds using imported client...');
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

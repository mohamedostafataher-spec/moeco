
import { rssService } from './server/services/rssService';
import { supabase } from './server/services/supabaseClient';

async function testSync() {
  console.log('--- Manual Sync Test ---');
  try {
    const { data: sources, error } = await supabase.from('rss_sources').select('*');
    if (error) {
        console.error('Failed to fetch sources:', error);
        return;
    }
    console.log(`Found ${sources?.length} sources in DB.`);
    
    for (const source of (sources || [])) {
        console.log(`Syncing ${source.name} (${source.url})...`);
        const result = await rssService.syncFeed(source);
        console.log(`Result for ${source.name}: ${result} items.`);
    }
  } catch (e) {
    console.error('Sync Test Error:', e);
  }
}

testSync();

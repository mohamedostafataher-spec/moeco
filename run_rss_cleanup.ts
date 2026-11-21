import { supabase } from './server/services/supabaseClient.ts';

async function cleanupBrokenFeeds() {
  console.log('Cleaning up broken RSS feeds from database...');
  
  const brokenUrls = [
    'https://www.youm7.com/rss/356',
    'https://m.youm7.com/rss/SectionRss?SectionID=203',
    'https://m.youm7.com/rss/SectionRss?SectionID=319',
    'https://www.youm7.com/rss/359'
  ];

  const { data, error } = await supabase
    .from('rss_sources')
    .update({ is_active: false })
    .in('feed_url', brokenUrls);

  if (error) {
    console.error('Error deactivating broken feeds:', error);
    // Try by 'url' column as well just in case
    const { error: error2 } = await supabase
      .from('rss_sources')
      .update({ is_active: false })
      .in('url', brokenUrls);
    if (error2) console.error('Error deactivating by url as well:', error2);
  } else {
    console.log('Successfully deactivated broken Youm7 feeds.');
  }

  // Also fix the supabase-related errors by ensuring we're connected
  const { data: testData, error: testError } = await supabase.from('news').select('id').limit(1);
  if (testError) {
    console.error('Supabase connection test failed:', testError);
  } else {
    console.log('Supabase connection verified.');
  }
}

cleanupBrokenFeeds();

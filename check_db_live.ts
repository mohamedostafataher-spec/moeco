import { createClient } from '@supabase/supabase-js';

// Fallback if env vars not loaded
const URL = process.env.VITE_SUPABASE_URL || 'https://awwbrmgzdqazhpsrznpq.supabase.co';
const KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__KqCxPd9F40H2LytPW0vAQ_BqzwbpUg';

const supabase = createClient(URL, KEY);

async function check() {
  const tables = ['scientific_data', 'news_articles', 'eco_alerts', 'transport_logs', 'rss_sources'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('id').limit(1);
    if (error) {
      console.log(`Table ${t} error:`, error.message);
    } else {
      console.log(`Table ${t} count:`, data?.length);
    }
  }
}
check();

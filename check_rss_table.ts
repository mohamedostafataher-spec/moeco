import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkSupabase() {
  const { data, error } = await supabase.from('rss_sources').select('id', { head: true, count: 'exact' });
  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('find the table')) {
        console.error('rss_sources table not found.');
    } else {
        console.error('Error checking rss_sources table:', error.message);
    }
  } else {
    console.log('rss_sources table found.');
  }
}
checkSupabase();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDB() {
  console.log('--- Checking rss_sources ---');
  const { data: sources, error: sError } = await supabase.from('rss_sources').select('*');
  if (sError) console.error('Sources Error:', sError);
  else console.log(`Found ${sources?.length} sources. Active: ${sources?.filter(s => s.is_active).length}`);

  console.log('--- Checking news ---');
  const { data: news, error: nError } = await supabase.from('news').select('*').limit(5);
  if (nError) console.error('News Error:', nError);
  else console.log(`Found ${news?.length} news items.`);

  // Check columns of news
  const { data: cols, error: cError } = await supabase.rpc('get_table_columns', { table_name: 'news' });
  if (cError) {
      // Fallback if RPC doesn't exist
      console.log('Could not check columns via RPC');
  } else {
      console.log('Columns:', cols);
  }
}

checkDB();

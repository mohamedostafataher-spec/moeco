import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function checkRows() {
  const { data, error } = await supabase.from('rss_sources').select('*');
  if (error) {
    console.error('Error selecting from rss_sources:', error.message);
  } else {
    console.log('RSS Sources:', data);
  }
}
checkRows();

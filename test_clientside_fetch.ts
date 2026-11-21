import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data: gov, error: govErr } = await supabase.from('gov_services').select('*');
  const { data: news, error: newsErr } = await supabase.from('news').select('*').limit(5);

  console.log('Gov services fetch from JS Client:', gov?.length, govErr);
  console.log('News fetch from JS Client:', news?.length, newsErr);
}
run();

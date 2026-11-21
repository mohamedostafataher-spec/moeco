import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('news').select('*').limit(20);
  console.log('Categories:', data?.map(d => ({title: d.title, category: d.category, target_screen: d.target_screen})));
}

run();

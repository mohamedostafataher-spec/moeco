import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('gov_services').select('*').eq('is_active', true);
  console.log('Gov services query length:', data?.length);
  console.log('Error:', error);
}

run();

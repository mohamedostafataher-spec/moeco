import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, ''), 
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
  const { data: ut } = await supabase.from('utility_tiers').select('*').limit(1);
  if (ut) console.log('utility_tiers columns:', Object.keys(ut[0] || {}));
}
check();

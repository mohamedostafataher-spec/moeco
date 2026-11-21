
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const tables = [
    'profiles', 'consumption_records', 'carbon_activities', 
    'scientific_data', 'coupons', 'matches', 'news', 'rss_sources', 'point_transactions', 'carbon_tracking', 'bills', 'transport_logs'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
       console.log(`Table '${table}': ERROR [${error.code}] - ${error.message}`);
    } else {
       console.log(`Table '${table}': OK`);
    }
  }
}

check();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkSchema() {
  console.log('Checking Supabase tables...');
  
  // We can't easily list all tables via the public anon key JS client, but we can try to select from known ones.
  const tables = [
    'users', 'profiles', 'consumption_records', 'carbon_footprint_logs', 
    'utility_tiers', 'scientific_data', 'badges', 'user_badges', 
    'challenges', 'user_challenges', 'points_transactions', 'bills',
    'gov_services', 'news', 'rss_sources'
  ];

  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(1);
    if (error) {
      console.log(`❌ Table [${table}]: ${error.message} (Code: ${error.code})`);
    } else {
      console.log(`✅ Table [${table}]: Exists (Count: ${count})`);
    }
  }
}

checkSchema();

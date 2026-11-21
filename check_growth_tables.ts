import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function checkGrowthTables() {
  const tables = ['user_scores', 'badges', 'user_badges', 'challenges', 'user_challenges'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table} does not exist or not accessible:`, error.message);
    } else {
      console.log(`Table ${table} exists.`);
    }
  }
}

checkGrowthTables();

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkAll() {
  const tables = [
    'users', 'profiles', 'utility_tiers', 'scientific_data', 
    'carbon_footprint_logs', 'consumption_records', 'countries', 'governorates'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ Table [${table}]: Error - ${error.message}`);
      } else {
        console.log(`✅ Table [${table}]: Exists (Count: ${count})`);
      }
    } catch (e) {
      console.log(`❌ Table [${table}]: Exception`);
    }
  }
}

checkAll();

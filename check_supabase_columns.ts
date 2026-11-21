import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkColumns() {
  const tables = ['users', 'profiles'];
  for (const table of tables) {
    console.log(`\nColumns for [${table}]:`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Error: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
      console.log('No data to extract columns from.');
    }
  }
}

checkColumns();

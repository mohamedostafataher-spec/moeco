import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const sql = fs.readFileSync('SETUP_UTILITY_TIERS.sql', 'utf8');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    const { data: data2, error: error2 } = await supabase.rpc('exec', { query: sql }); // some variations
    console.error('Error with exec_sql:', error);
    if(error2) console.error('Error with exec:', error2);
  } else {
    console.log('Success:', data);
  }
}
run();

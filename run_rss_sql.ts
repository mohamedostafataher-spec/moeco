import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const sql = fs.readFileSync('UPDATE_RSS_SOURCES_2026_FINAL.sql', 'utf8');
  console.log('Running RSS Sources SQL Update...');
  
  try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.error('exec_sql failed:', error.message);
      } else {
        console.log('Successfully updated RSS sources table/data');
      }
  } catch (e) {
      console.error('Runtime error:', e);
  }
}
run();

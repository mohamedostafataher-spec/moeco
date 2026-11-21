import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const sql = fs.readFileSync('GOV_SERVICES_SETUP.sql', 'utf8');
  console.log('Running Gov Services setup SQL...');
  
  try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.error('SQL Execution failed:', error.message);
      } else {
        console.log('Success:', data);
      }
  } catch (e) {
      console.error('Runtime error:', e);
  }
}
run();

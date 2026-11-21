import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

let url = process.env.VITE_SUPABASE_URL || '';
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, supabaseKey);

async function run() {
  const sql = fs.readFileSync('database/ADD_TRANSPARENCY_TABLES.sql', 'utf8');
  
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

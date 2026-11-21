import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const sql = fs.readFileSync('FIX_LATEST_DB_ERRORS.sql', 'utf8');
  console.log('Running SQL...');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
     console.error('Error with exec_sql RPC:', error);
  } else {
     console.log('Success with exec_sql');
  }
}

run();

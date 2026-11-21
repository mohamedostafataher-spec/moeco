import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url && typeof url === 'string') {
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];
}

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const sql = fs.readFileSync('FIX_POLICIES_AND_CLEANUP.sql', 'utf8');
  console.log('Running Policy Cleanup and Fix...');
  
  try {
      // Trying 'exec_sql' RPC
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.error('exec_sql failed:', error.message);
        console.log('Ensure you have the exec_sql RPC function defined in your database.');
      } else {
        console.log('Successfully applied SQL fix.');
      }
  } catch (e) {
      console.error('Runtime error:', e);
  }
}
run();

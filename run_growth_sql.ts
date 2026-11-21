
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const sql = fs.readFileSync('CREATE_GROWTH_SYSTEM.sql', 'utf8');
  // Using custom exec_sql if available, or just use the service role key to perform DDL if supported
  // Actually, standard Supabase JS client doesn't support executing arbitrary SQL files directly via .rpc unless it's set up
  // I will try to execute it as individual statements if possible, or just rely on the existing run_sql.ts mechanism if it works.
  // Wait, the run_sql.ts uses rpc('exec_sql', ...). Let's assume this exists.
  const { data, error } = await (supabase as any).rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success');
  }
}
run();

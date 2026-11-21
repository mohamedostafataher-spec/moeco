import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Try to use a service key to bypass RLS, default to ANON if missing
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://eiboutdvbjoipdpeqrci.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYm91dGR2YmpvaXBkcGVxcmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMTcwMjUsImV4cCI6MjA1Njc5MzAyNX0.VwXh_n3v2Q9K-F33c7r2qM_54Q63V2QoN_pGq8mB3H8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = fs.readFileSync(path.join(process.cwd(), 'PERFORMANCE_INDEXES_V2.sql'), 'utf8');
  console.log('Running performance optimization SQL...');
  
  // Try calling the exec_sql RPC
  try {
      // In Supabase, if pgsodium is available and executing plain SQL via RPC isn't possible,
      // it might fail. Often we have an 'exec_sql' RPC function installed for this testing environment.
      // We will also use postgres-meta if not.
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

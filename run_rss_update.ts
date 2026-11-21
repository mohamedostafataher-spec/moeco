
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://eiboutdvbjoipdpeqrci.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYm91dGR2YmpvaXBkcGVxcmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMTcwMjUsImV4cCI6MjA1Njc5MzAyNX0.VwXh_n3v2Q9K-F33c7r2qM_54Q63V2QoN_pGq8mB3H8';
if (supabaseUrl && typeof supabaseUrl === 'string') {
  if (supabaseUrl.endsWith('/')) supabaseUrl = supabaseUrl.slice(0, -1);
  if (supabaseUrl.includes('/rest/v1')) supabaseUrl = supabaseUrl.split('/rest/v1')[0];
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const sql = `SELECT column_name FROM information_schema.columns WHERE table_name = 'rss_sources';`;
  console.log('Running SQL...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error('RPC Error:', error.message);
  } else {
    console.log('Result:', data);
  }
}
run();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://eiboutdvbjoipdpeqrci.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYm91dGR2YmpvaXBkcGVxcmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMTcwMjUsImV4cCI6MjA1Njc5MzAyNX0.VwXh_n3v2Q9K-F33c7r2qM_54Q63V2QoN_pGq8mB3H8';

if (supabaseUrl && typeof supabaseUrl === 'string') {
  if (supabaseUrl.endsWith('/')) supabaseUrl = supabaseUrl.slice(0, -1);
  if (supabaseUrl.includes('/rest/v1')) supabaseUrl = supabaseUrl.split('/rest/v1')[0];
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
  console.log('Fetching tables...');
  
  try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.error('exec_sql error:', error.message);
      } else {
        console.log('Public tables:', data);
      }
  } catch (e) {
      console.error('Runtime error:', e);
  }
}
run();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const sql = `
CREATE TABLE IF NOT EXISTS emergency_reports (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  category TEXT,
  title TEXT,
  description TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  photo_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  console.log('Error:', error);
  console.log('Data:', data);
}
run();

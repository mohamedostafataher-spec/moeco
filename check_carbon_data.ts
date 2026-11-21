
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkCarbon() {
  const { data, error } = await supabase.from('carbon_activities').select('*').limit(5);
  console.log('Carbon Activities:', data);
  if (error) console.error('Error:', error);
}

checkCarbon();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function checkTables() {
  const { data, error } = await supabase.from('emission_factors').select('*').limit(1);
  if (error) {
    console.log('Error accessing emission_factors:', error.message);
  } else {
    console.log('emission_factors exists. Data:', data);
  }
}

checkTables();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function checkScientificData() {
  const { data, error } = await supabase.from('scientific_data').select('*');
  if (error) {
    console.log('Error accessing scientific_data:', error.message);
  } else {
    console.log('scientific_data contents:', data);
  }
}

checkScientificData();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function checkUsageTable() {
  const { error } = await supabase.from('usage').select('*').limit(1);
  if (error) {
    console.log('Usage table does not exist or error:', error.message);
  } else {
    console.log('Usage table exists.');
  }
}

checkUsageTable();

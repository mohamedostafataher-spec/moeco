
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, ''),
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkTransport() {
  const { data, error } = await supabase.from('transport_services').select('*').limit(5);
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Transport Services Data:', JSON.stringify(data, null, 2));
}

checkTransport();

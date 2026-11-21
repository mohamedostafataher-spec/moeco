
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function checkTransportLogs() {
  const { data, error } = await supabase.from('transport_logs').select('*').limit(1);
  if (error) {
    console.log('Error accessing transport_logs:', error.message);
  } else {
    console.log('transport_logs exists.');
  }
}

checkTransportLogs();

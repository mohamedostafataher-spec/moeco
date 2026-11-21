
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function checkTransportTables() {
  const { data: lines, error: lineErr } = await supabase.from('transport_lines').select('*');
  const { data: stations, error: stErr } = await supabase.from('transport_stations').select('*').limit(5);
  
  if (lineErr || stErr) {
    console.error('Error accessing transport tables:', lineErr?.message || stErr?.message);
  } else {
    console.log('Transport lines:', lines);
    console.log('Transport stations:', stations);
  }
}

checkTransportTables();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data, error } = await supabase.from('government_services').select('*').limit(1);
  console.log('government_services:', error || 'exists');
  const { data: d2, error: e2 } = await supabase.from('service_steps').select('*').limit(1);
  console.log('service_steps:', e2 || 'exists');
}
check();

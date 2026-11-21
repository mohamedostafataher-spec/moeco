import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkData() {
  console.log('Checking Utility Tiers:');
  const { data: tiers, error: tiersError } = await supabase.from('utility_tiers').select('*');
  if (tiersError) console.error(tiersError);
  else console.log(JSON.stringify(tiers, null, 2));

  console.log('\nChecking Scientific Data:');
  const { data: scientific, error: sciError } = await supabase.from('scientific_data').select('*');
  if (sciError) console.error(sciError);
  else console.log(JSON.stringify(scientific, null, 2));
}

checkData();

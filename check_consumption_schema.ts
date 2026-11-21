
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name_input: 'consumption_records' });
  if (error) {
    // If RPC doesn't exist, try a simple select with limit 0
    console.log('RPC failed, trying select * limit 0');
    const { data: data2, error: error2 } = await supabase.from('consumption_records').select('*').limit(1);
    if (error2) console.error('Error:', error2);
    else console.log('Columns:', Object.keys(data2[0] || {}));
  } else {
    console.log('Columns:', data);
  }
}

checkSchema();

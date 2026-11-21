import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function inspectTable() {
  console.log('Inspecting government_services table structure...');
  
  // Querying information_schema to see columns
  const { data, error } = await supabase
    .from('government_services')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching table data:', error);
  } else if (data && data.length > 0) {
    console.log('Found columns:', Object.keys(data[0]));
  } else {
    console.log('Table is empty, checking columns via system query...');
    // Fallback: try to see if we can get column list another way
    const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'government_services' });
    if (colError) console.warn('RPC check failed (expected if not defined).');
    else console.log('Columns via RPC:', cols);
  }
}

inspectTable();

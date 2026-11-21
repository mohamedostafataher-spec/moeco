
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function listTablesAndColumns() {
  // Query information_schema
  const { data, error } = await supabase.rpc('get_tables_and_columns'); 
  // If rpc fails, we have to try another way
  
  if (error) {
    console.log('RPC get_tables_and_columns failed, attempting fallback query');
    const { data: fallbackData, error: fallbackError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
    
    if (fallbackError) {
        console.error('Fallback failed:', fallbackError.message);
    } else {
        console.log('Tables found:', fallbackData.map((t: any) => t.table_name));
    }
  } else {
    console.log('Schema:', data);
  }
}

listTablesAndColumns();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkColumns() {
  const tables = ['consumption_records', 'carbon_activities'];
  const { data: columns, error } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name')
    .in('table_name', tables);

  if (error) {
    console.error('Error fetching columns:', error.message);
    return;
  }
  console.log(JSON.stringify(columns, null, 2));
}
checkColumns();

import { supabase } from './services/supabaseClient';

async function listAllTables() {
  const { data, error } = await supabase.rpc('get_tables_info');
  if (!error && data) {
    console.log(data);
  } else {
    // try querying pg_tables or information_schema if rpc fails
    const { data: tables, error: infoError } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');
    if (!infoError) {
      console.log('Tables:', tables.map(t => t.table_name));
    } else {
      console.error(error);
      console.error(infoError);
    }
  }
}
listAllTables();

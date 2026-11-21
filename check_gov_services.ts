import { supabase } from './supabaseClient';

export const checkTables = async () => {
    const { data: cols1 } = await supabase.rpc('get_table_columns_v2', { table_name_in: 'government_services' });
    console.log("government_services", cols1);
}
checkTables();

import { supabase } from './server/services/supabaseClient';
async function test() {
  const { data, error } = await supabase.rpc('get_policies_test', {}); // Not real maybe
  const { data: res } = await supabase.from('consumption_records').select('*').limit(1);
}
test();

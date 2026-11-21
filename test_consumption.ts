import { supabase } from './server/services/supabaseClient';
async function test() {
  const { data, error } = await supabase.from('consumption_records').select('*').limit(1);
  console.log(data, error);
}
test();

import { supabase } from './server/services/supabaseClient';
async function test() {
  const { data, error } = await supabase.from('consumption_records').select('*');
  console.log(error);
}
test();

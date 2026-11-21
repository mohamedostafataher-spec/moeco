import { supabase } from './server/services/supabaseClient';

async function test() {
  const { data, error } = await supabase.from('consumption_records').select('*').limit(1);
  if (data && data.length > 0) {
     console.log(Object.keys(data[0]));
  }
}
test();

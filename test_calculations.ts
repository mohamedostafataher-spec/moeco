import { supabase } from './server/services/supabaseClient';

async function test() {
  const { data, error } = await supabase.from('calculations').select('*').limit(1);
  console.log("Calculations result:", error?.message || 'Success');
}
test();
